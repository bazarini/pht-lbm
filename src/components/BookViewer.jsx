import { useState, useCallback } from 'react'
import styles from './BookViewer.module.css'

export default function BookViewer({ album }) {
  const pages = album.pages
  // spread: 0 = cover, 1 = pages 0-1, 2 = pages 2-3, ...
  const totalSpreads = Math.ceil(pages.length / 2) + 1
  const [spread, setSpread] = useState(0)
  const [flipping, setFlipping] = useState(null) // 'forward' | 'back' | null

  const canPrev = spread > 0
  const canNext = spread < totalSpreads - 1

  const flip = useCallback(
    (dir) => {
      if (flipping) return
      if (dir === 'forward' && !canNext) return
      if (dir === 'back' && !canPrev) return
      setFlipping(dir)
      setTimeout(() => {
        setSpread((s) => (dir === 'forward' ? s + 1 : s - 1))
        setFlipping(null)
      }, 700)
    },
    [flipping, canNext, canPrev]
  )

  function getPageContent(pageIndex, pageNumLabel) {
    const page = pages[pageIndex]
    if (!page) return <BlankPage />
    return <PhotoPage page={page} pageNum={pageNumLabel} />
  }

  function renderSpread() {
    if (spread === 0) {
      return (
        <div className={styles.spread}>
          <div className={`${styles.pageLeft} ${styles.cover}`}>
            <div className={styles.coverLine} />
            <div className={styles.coverTitle}>{album.title}</div>
            <div className={styles.coverLine} />
            <div className={styles.coverSub}>Фотоальбом</div>
          </div>
          <div className={styles.pageRight}>
            {pages[0] ? (
              <PhotoPage page={pages[0]} pageNum={1} />
            ) : (
              <BlankPage text="Добавьте фото в редакторе" />
            )}
          </div>
        </div>
      )
    }

    const leftIndex = (spread - 1) * 2 + 1
    const rightIndex = leftIndex + 1
    const leftNum = leftIndex + 1
    const rightNum = rightIndex + 1

    return (
      <div className={styles.spread}>
        <div className={styles.pageLeft}>
          {pages[leftIndex] ? (
            <PhotoPage page={pages[leftIndex]} pageNum={leftNum} side="left" />
          ) : (
            <BlankPage />
          )}
        </div>
        <div className={styles.pageRight}>
          {pages[rightIndex] ? (
            <PhotoPage page={pages[rightIndex]} pageNum={rightNum} side="right" />
          ) : (
            <BlankPage />
          )}
        </div>
      </div>
    )
  }

  const flipClass = flipping === 'forward' ? styles.flippingForward : styles.flippingBack

  return (
    <>
      <div className={styles.scene}>
        <div className={styles.book}>
          {renderSpread()}
          {flipping && <div className={`${styles.flipper} ${flipClass}`} />}
        </div>
      </div>

      <div className={styles.nav}>
        <button
          className={styles.navBtn}
          onClick={() => flip('back')}
          disabled={!canPrev || !!flipping}
        >
          ←
        </button>
        <span className={styles.navInfo}>
          {spread === 0 ? 'Обложка' : `Разворот ${spread} / ${totalSpreads - 1}`}
        </span>
        <button
          className={styles.navBtn}
          onClick={() => flip('forward')}
          disabled={!canNext || !!flipping}
        >
          →
        </button>
      </div>
    </>
  )
}

function PhotoPage({ page, pageNum, side }) {
  return (
    <>
      {page.photo ? (
        <img className={styles.photo} src={page.photo} alt={page.caption || 'Фото'} />
      ) : (
        <div className={styles.photoEmpty}>Нет фото</div>
      )}
      {page.caption && (
        <>
          <div className={styles.divider} />
          <p className={styles.caption}>{page.caption}</p>
        </>
      )}
      <span className={styles.pageNum}>{pageNum}</span>
    </>
  )
}

function BlankPage({ text }) {
  return (
    <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 14, color: '#c4b49a' }}>
      {text || ''}
    </p>
  )
}
