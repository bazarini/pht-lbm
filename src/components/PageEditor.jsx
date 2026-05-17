import { useRef, useState, useCallback, useEffect } from 'react'
import PhotoUploader from './PhotoUploader'
import styles from './PageEditor.module.css'

export default function PageEditor({ page, index, onChange, onDelete }) {
  const previewRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  const photoX = page.photoX ?? 50
  const photoY = page.photoY ?? 50

  function update(patch) {
    onChange({ ...page, ...patch })
  }

  const calcPosition = useCallback((e) => {
    const rect = previewRef.current.getBoundingClientRect()
    const x = Math.max(10, Math.min(90, ((e.clientX - rect.left) / rect.width) * 100))
    const y = Math.max(10, Math.min(90, ((e.clientY - rect.top) / rect.height) * 100))
    return { x, y }
  }, [])

  const handleMouseDown = useCallback((e) => {
    e.preventDefault()
    setDragging(true)
  }, [])

  const handleMouseMove = useCallback((e) => {
    if (!dragging) return
    const { x, y } = calcPosition(e)
    update({ photoX: x, photoY: y })
  }, [dragging, page])

  const handleMouseUp = useCallback(() => {
    setDragging(false)
  }, [])

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [dragging, handleMouseMove, handleMouseUp])

  return (
    <div className={styles.page}>
      <div className={styles.number}>{index + 1}</div>
      <div className={styles.content}>
        <PhotoUploader photo={page.photo} onChange={(photo) => update({ photo })} />

        {page.photo && (
          <div className={styles.positionBlock}>
            <p className={styles.positionLabel}>Позиция на странице — перетащите фото:</p>
            <div className={styles.preview} ref={previewRef}>
              <img
                src={page.photo}
                className={`${styles.previewImg} ${dragging ? styles.grabbing : ''}`}
                style={{ left: `${photoX}%`, top: `${photoY}%` }}
                onMouseDown={handleMouseDown}
                draggable={false}
                alt=""
              />
            </div>
          </div>
        )}

        <textarea
          className={styles.caption}
          placeholder="Подпись к фотографии..."
          value={page.caption}
          onChange={(e) => update({ caption: e.target.value })}
        />
        <button className={styles.btnDelete} onClick={onDelete}>
          Удалить страницу
        </button>
      </div>
    </div>
  )
}
