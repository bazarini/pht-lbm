import { useState, useCallback, useRef } from 'react'
import TransformablePhoto from './TransformablePhoto'
import styles from './BookViewer.module.css'

export default function BookViewer({
  album,
  isEditing,
  selectedId,
  onSelectPhoto,
  onUpdatePagePhoto,
  onUpdateFloating,
  onDeletePagePhoto,
  onDeleteFloating,
  onEjectPhoto,
  onInjectPhoto,
  onNextSpread,
}) {
  const pages = album.pages ?? []
  const floatingPhotos = album.floatingPhotos ?? []

  // Cover spread uses pages[0]; each photo spread uses 2 pages.
  // With N pages: covers ceil((N-1)/2) photo spreads.
  const totalSpreads = Math.max(1, Math.ceil((pages.length - 1) / 2) + 1)
  const [spread, setSpread] = useState(0)
  const [flipping, setFlipping] = useState(null)

  const bookRef = useRef(null)
  const leftPageRef = useRef(null)
  const rightPageRef = useRef(null)

  // Indices of pages in current spread
  function getSpreadPageIndices(s) {
    if (s === 0) return [null, 0]   // left=cover, right=page[0]
    const li = (s - 1) * 2 + 1
    return [li, li + 1]
  }

  const [leftIdx, rightIdx] = getSpreadPageIndices(spread)

  // canNext: in edit mode — allow if current spread has any photo
  const spreadHasPhoto = [leftIdx, rightIdx]
    .filter((i) => i !== null && i >= 0)
    .some((i) => (pages[i]?.photos?.length ?? 0) > 0)

  const canPrev = spread > 0
  const canNext = isEditing ? spreadHasPhoto : spread < totalSpreads - 1

  const flip = useCallback((dir) => {
    if (flipping) return
    if (dir === 'forward' && !canNext) return
    if (dir === 'back' && !canPrev) return

    setFlipping(dir)
    setTimeout(() => {
      if (dir === 'forward') {
        const nextSpread = spread + 1
        if (isEditing) {
          // Create pages if the target spread doesn't have them yet
          const [nextLi, nextRi] = getSpreadPageIndices(nextSpread)
          const needsNewPages = [nextLi, nextRi]
            .filter((i) => i !== null && i !== undefined && i >= 0)
            .some((i) => pages[i] === undefined)
          if (needsNewPages) onNextSpread?.()
        }
        setSpread(nextSpread)
      } else {
        setSpread((s) => s - 1)
      }
      setFlipping(null)
    }, 600)
  }, [flipping, canNext, canPrev, spread, pages, isEditing, onNextSpread])

  function renderPageContents(pageIdx, pageRef) {
    if (pageIdx === null) return null // cover left side handled separately
    const page = pages[pageIdx]
    if (!page) return null

    return (page.photos ?? []).map((photo) => (
      <TransformablePhoto
        key={photo.id}
        photo={photo}
        isEditing={isEditing}
        isSelected={selectedId === photo.id}
        onSelect={() => onSelectPhoto(photo.id)}
        onDeselect={() => onSelectPhoto(null)}
        onUpdate={(patch) => onUpdatePagePhoto(pageIdx, photo.id, patch)}
        onDelete={() => onDeletePagePhoto(pageIdx, photo.id)}
        onEject={(bookCoords) => onEjectPhoto(pageIdx, photo.id, bookCoords)}
        containerRef={pageRef}
        pageRef={pageRef}
        bookRef={bookRef}
        coordinateSystem="page"
      />
    ))
  }

  const flipClass = flipping === 'forward' ? styles.flippingForward : styles.flippingBack

  return (
    <>
      <div className={styles.scene}>
        <div
          className={styles.book}
          ref={bookRef}
          onClick={isEditing ? () => onSelectPhoto(null) : undefined}
        >
          {/* ---- Spread ---- */}
          <div className={styles.spread}>
            {/* Left page */}
            <div
              ref={leftPageRef}
              className={`${styles.pageLeft} ${spread === 0 ? styles.cover : ''} ${isEditing ? styles.pageEditing : ''}`}
            >
              {spread === 0 ? (
                <CoverLeft title={album.title} />
              ) : (
                <>
                  {renderPageContents(leftIdx, leftPageRef)}
                  {pages[leftIdx] && <span className={styles.pageNum}>{leftIdx + 1}</span>}
                </>
              )}
            </div>

            {/* Right page */}
            <div ref={rightPageRef} className={`${styles.pageRight} ${isEditing ? styles.pageEditing : ''}`}>
              {renderPageContents(rightIdx, rightPageRef)}
              {pages[rightIdx] && <span className={styles.pageNum}>{rightIdx + 1}</span>}
            </div>
          </div>

          {/* ---- Floating layer ---- */}
          <div
            className={styles.floatingLayer}
            style={{ pointerEvents: isEditing ? 'none' : 'none' }}
          >
            {floatingPhotos.map((photo) => (
              <TransformablePhoto
                key={photo.id}
                photo={photo}
                isEditing={isEditing}
                isSelected={selectedId === photo.id}
                onSelect={() => onSelectPhoto(photo.id)}
                onDeselect={() => onSelectPhoto(null)}
                onUpdate={(patch) => onUpdateFloating(photo.id, patch)}
                onDelete={() => onDeleteFloating(photo.id)}
                onInject={(pageCoords) => {
                  // Determine which page the cursor is on
                  const lRect = leftPageRef.current?.getBoundingClientRect()
                  const rRect = rightPageRef.current?.getBoundingClientRect()
                  // Inject to right page by default (last spread page)
                  const targetIdx = rightIdx ?? leftIdx
                  if (targetIdx !== null && targetIdx !== undefined) {
                    onInjectPhoto(photo.id, targetIdx, pageCoords)
                  }
                }}
                containerRef={bookRef}
                pageRef={rightPageRef}
                bookRef={bookRef}
                coordinateSystem="book"
              />
            ))}
          </div>

          {/* Spine shadow */}
          <div className={styles.spineShadow} />

          {/* Flip animation overlay */}
          {flipping && <div className={`${styles.flipper} ${flipClass}`} />}
        </div>
      </div>

      {/* Navigation */}
      <div className={styles.nav}>
        <button
          className={styles.navBtn}
          onClick={() => flip('back')}
          disabled={!canPrev || !!flipping}
        >←</button>
        <span className={styles.navInfo}>
          {spread === 0 ? 'Обложка' : `Разворот ${spread} / ${totalSpreads - 1}`}
        </span>
        <button
          className={styles.navBtn}
          onClick={() => flip('forward')}
          disabled={!canNext || !!flipping}
        >→</button>
      </div>
    </>
  )
}

function CoverLeft({ title }) {
  return (
    <>
      <div className={styles.coverLine} />
      <div className={styles.coverTitle}>{title}</div>
      <div className={styles.coverLine} />
      <div className={styles.coverSub}>Фотоальбом</div>
    </>
  )
}

function EmptyPage({ isEditing }) {
  return (
    <p className={styles.emptyPage}>
      {isEditing ? 'Добавьте фото через кнопку в хедере' : ''}
    </p>
  )
}
