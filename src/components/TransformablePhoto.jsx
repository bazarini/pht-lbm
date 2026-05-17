import { useRef, useState, useCallback, useEffect } from 'react'
import styles from './TransformablePhoto.module.css'

/**
 * coordinateSystem: 'page' | 'book'
 *   page  — x/y are % of the page element
 *   book  — x/y are % of the book element (for floating photos)
 *
 * containerRef — ref to the page or book container for coordinate calculations
 * pageRef      — ref to the page element (only for 'page' mode, used for eject detection)
 * bookRef      — ref to the book element (only for 'page' mode, used for eject coords)
 */
export default function TransformablePhoto({
  photo,
  isEditing,
  isSelected,
  onSelect,
  onDeselect,
  onUpdate,
  onDelete,
  onEject,    // (bookCoords: {x, y}) — called when dragged out of page
  onInject,   // (pageIdx, pageCoords: {x, y}) — called when floating dragged into a page
  containerRef,
  pageRef,
  bookRef,
  coordinateSystem = 'page',
}) {
  const wrapperRef = useRef(null)
  const [editingCaption, setEditingCaption] = useState(false)
  const [captionDraft, setCaptionDraft] = useState(photo.caption)

  // Sync caption draft when photo changes externally
  useEffect(() => { setCaptionDraft(photo.caption) }, [photo.caption])

  // ---- Drag ----
  const dragState = useRef(null)

  const handleDragStart = useCallback((e) => {
    if (!isEditing) return
    e.stopPropagation()
    e.preventDefault()
    onSelect()

    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()

    dragState.current = {
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startX: photo.x,
      startY: photo.y,
      containerRect: rect,
    }

    const onMove = (ev) => {
      if (!dragState.current) return
      const { startMouseX, startMouseY, startX, startY, containerRect } = dragState.current
      const dx = ((ev.clientX - startMouseX) / containerRect.width) * 100
      const dy = ((ev.clientY - startMouseY) / containerRect.height) * 100
      const newX = Math.max(0, Math.min(100, startX + dx))
      const newY = Math.max(0, Math.min(100, startY + dy))

      // Eject check (only for page photos)
      if (coordinateSystem === 'page' && pageRef?.current && bookRef?.current) {
        const pr = pageRef.current.getBoundingClientRect()
        const br = bookRef.current.getBoundingClientRect()
        const inside = ev.clientX >= pr.left && ev.clientX <= pr.right
                    && ev.clientY >= pr.top  && ev.clientY <= pr.bottom
        if (!inside) {
          const bx = ((ev.clientX - br.left) / br.width) * 100
          const by = ((ev.clientY - br.top)  / br.height) * 100
          dragState.current = null
          window.removeEventListener('mousemove', onMove)
          window.removeEventListener('mouseup', onUp)
          onEject?.({ x: Math.max(0, Math.min(100, bx)), y: Math.max(0, Math.min(100, by)) })
          return
        }
      }

      // Inject check (only for floating photos)
      if (coordinateSystem === 'book' && onInject && pageRef?.current) {
        const pr = pageRef.current.getBoundingClientRect()
        const inside = ev.clientX >= pr.left && ev.clientX <= pr.right
                    && ev.clientY >= pr.top  && ev.clientY <= pr.bottom
        if (inside) {
          const px = ((ev.clientX - pr.left) / pr.width) * 100
          const py = ((ev.clientY - pr.top)  / pr.height) * 100
          dragState.current = null
          window.removeEventListener('mousemove', onMove)
          window.removeEventListener('mouseup', onUp)
          onInject({ x: Math.max(0, Math.min(100, px)), y: Math.max(0, Math.min(100, py)) })
          return
        }
      }

      onUpdate({ x: newX, y: newY })
    }

    const onUp = () => {
      dragState.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [isEditing, photo.x, photo.y, coordinateSystem, containerRef, pageRef, bookRef, onSelect, onUpdate, onEject, onInject])

  // ---- Resize (corner handles) ----
  const handleResizeStart = useCallback((e) => {
    e.stopPropagation()
    e.preventDefault()

    const wrapper = wrapperRef.current
    if (!wrapper) return
    const rect = wrapper.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const initDist = Math.hypot(e.clientX - cx, e.clientY - cy)
    const initScale = photo.scale

    const onMove = (ev) => {
      const dist = Math.hypot(ev.clientX - cx, ev.clientY - cy)
      const newScale = Math.max(0.3, Math.min(4, (dist / initDist) * initScale))
      onUpdate({ scale: newScale })
    }
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [photo.scale, onUpdate])

  // ---- Rotate ----
  const handleRotateStart = useCallback((e) => {
    e.stopPropagation()
    e.preventDefault()

    const wrapper = wrapperRef.current
    if (!wrapper) return
    const rect = wrapper.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2

    const onMove = (ev) => {
      const angle = Math.atan2(ev.clientY - cy, ev.clientX - cx) * (180 / Math.PI) + 90
      onUpdate({ rotation: Math.round(angle) })
    }
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [onUpdate])

  // ---- Caption ----
  function commitCaption() {
    setEditingCaption(false)
    onUpdate({ caption: captionDraft })
  }

  return (
    <div
      ref={wrapperRef}
      className={styles.wrapper}
      style={{
        left: `${photo.x}%`,
        top: `${photo.y}%`,
        width: `${photo.width}%`,
        transform: `translate(-50%, -50%) scale(${photo.scale}) rotate(${photo.rotation}deg)`,
        cursor: isEditing ? (isSelected ? 'move' : 'pointer') : 'default',
        zIndex: isSelected ? 15 : 10,
      }}
      onMouseDown={isEditing ? handleDragStart : undefined}
      onClick={isEditing ? (e) => { e.stopPropagation(); onSelect() } : undefined}
    >
      <div className={`${styles.inner} ${isSelected ? styles.selected : ''}`}>
        <div className={styles.frame}>
          <img src={photo.src} alt={photo.caption || ''} draggable={false} />
        </div>

        {/* Handles — only when selected in edit mode */}
        {isEditing && isSelected && (
          <>
            <div className={`${styles.handle} ${styles.handleTL}`} onMouseDown={handleResizeStart} />
            <div className={`${styles.handle} ${styles.handleTR}`} onMouseDown={handleResizeStart} />
            <div className={`${styles.handle} ${styles.handleBL}`} onMouseDown={handleResizeStart} />
            <div className={`${styles.handle} ${styles.handleBR}`} onMouseDown={handleResizeStart} />
            <div className={styles.rotateLine} />
            <div className={styles.rotateHandle} onMouseDown={handleRotateStart}>↻</div>
            <button
              className={styles.deleteBtn}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); onDelete() }}
            >×</button>
          </>
        )}
      </div>

      {/* Caption */}
      {isEditing ? (
        <div className={styles.captionArea} onMouseDown={(e) => e.stopPropagation()}>
          {editingCaption ? (
            <textarea
              className={styles.captionTextarea}
              value={captionDraft}
              autoFocus
              onChange={(e) => setCaptionDraft(e.target.value)}
              onBlur={commitCaption}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitCaption() } }}
            />
          ) : (
            <p
              className={styles.captionText}
              onClick={(e) => { e.stopPropagation(); setEditingCaption(true) }}
            >
              {photo.caption || <span className={styles.captionPlaceholder}>Подпись...</span>}
            </p>
          )}
        </div>
      ) : (
        photo.caption && (
          <div className={styles.captionArea}>
            <p className={styles.captionText}>{photo.caption}</p>
          </div>
        )
      )}
    </div>
  )
}
