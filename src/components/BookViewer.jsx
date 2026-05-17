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
  onTransferPagePhoto, // (fromPageIdx, toPageIdx, photoId, coords) — move between pages
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

  function renderPageContents(pageIdx, pageRef, siblingRef, siblingIdx) {
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
        onTransferToSibling={
          siblingIdx != null
            ? (coords) => onTransferPagePhoto?.(pageIdx, siblingIdx, photo.id, coords)
            : undefined
        }
        containerRef={pageRef}
        pageRef={pageRef}
        siblingPageRef={siblingRef}
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
                  {renderPageContents(leftIdx, leftPageRef, rightPageRef, rightIdx)}
                  {pages[leftIdx] && (
                    <div
                      className={`${styles.flipCorner} ${styles.flipCornerLeft} ${canPrev && !flipping ? styles.flipCornerActive : ''}`}
                      onClick={canPrev && !flipping ? () => flip('back') : undefined}
                    >
                      <span className={styles.cornerNum}>{leftIdx + 1}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Right page */}
            <div ref={rightPageRef} className={`${styles.pageRight} ${isEditing ? styles.pageEditing : ''}`}>
              {renderPageContents(rightIdx, rightPageRef, leftPageRef, leftIdx)}
              {pages[rightIdx] && (
                <div
                  className={`${styles.flipCorner} ${styles.flipCornerRight} ${canNext && !flipping ? styles.flipCornerActive : ''}`}
                  onClick={canNext && !flipping ? () => flip('forward') : undefined}
                >
                  <span className={styles.cornerNum}>{rightIdx + 1}</span>
                </div>
              )}
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
                  const targetIdx = rightIdx ?? leftIdx
                  if (targetIdx != null) onInjectPhoto(photo.id, targetIdx, pageCoords)
                }}
                onTransferToSibling={(pageCoords) => {
                  // Dropped on left page
                  if (leftIdx != null && leftIdx >= 0) onInjectPhoto(photo.id, leftIdx, pageCoords)
                }}
                containerRef={bookRef}
                pageRef={rightPageRef}
                siblingPageRef={leftIdx != null && leftIdx >= 0 ? leftPageRef : null}
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
