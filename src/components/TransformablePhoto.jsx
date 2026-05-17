import { useRef, useState, useCallback, useEffect } from 'react'
import styles from './TransformablePhoto.module.css'

export default function TransformablePhoto({
  photo,
  isEditing,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onEject,
  onInject,
  onTransferToSibling, // called when page photo dropped on the sibling page in the same spread
  siblingPageRef,      // the other page in the same spread (or secondary inject target for floats)
  containerRef,
  pageRef,
  bookRef,
  coordinateSystem = 'page',
}) {
  const wrapperRef = useRef(null)
  const [editingCaption, setEditingCaption] = useState(false)
  const [captionDraft, setCaptionDraft] = useState(photo.caption)

  // Visual state during drag/resize/rotate — updated every frame,
  // committed to store only on mouseup (avoid writing localStorage on every pixel)
  const [dragVisual, setDragVisual] = useState(null)      // {x, y}
  const [scaleVisual, setScaleVisual] = useState(null)    // number
  const [rotVisual, setRotVisual] = useState(null)        // number

  useEffect(() => { setCaptionDraft(photo.caption) }, [photo.caption])

  // Display values: visual during interaction, real otherwise
  const dispX   = dragVisual?.x   ?? photo.x
  const dispY   = dragVisual?.y   ?? photo.y
  const dispSc  = scaleVisual     ?? photo.scale
  const dispRot = rotVisual       ?? photo.rotation

  // ---- Drag ----
  const handleDragStart = useCallback((e) => {
    if (!isEditing) return
    e.stopPropagation()
    e.preventDefault()
    onSelect()

    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()

    document.documentElement.dataset.dragging = '1'

    let currentX = photo.x
    let currentY = photo.y

    const onMove = (ev) => {
      const dx = ((ev.clientX - e.clientX) / rect.width)  * 100
      const dy = ((ev.clientY - e.clientY) / rect.height) * 100
      currentX = photo.x + dx   // no clamping — let it go outside
      currentY = photo.y + dy
      setDragVisual({ x: currentX, y: currentY })
    }

    const onUp = (ev) => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      delete document.documentElement.dataset.dragging
      setDragVisual(null)

      // Eject / transfer: cursor released outside the home page
      if (coordinateSystem === 'page' && pageRef?.current && bookRef?.current) {
        const pr = pageRef.current.getBoundingClientRect()
        const br = bookRef.current.getBoundingClientRect()
        const inside = ev.clientX >= pr.left && ev.clientX <= pr.right
                    && ev.clientY >= pr.top  && ev.clientY <= pr.bottom
        if (!inside) {
          // Check sibling page first — transfer instead of ejecting to floating
          if (siblingPageRef?.current && onTransferToSibling) {
            const spr = siblingPageRef.current.getBoundingClientRect()
            const insideSibling = ev.clientX >= spr.left && ev.clientX <= spr.right
                               && ev.clientY >= spr.top  && ev.clientY <= spr.bottom
            if (insideSibling) {
              const px = Math.max(5, Math.min(95, ((ev.clientX - spr.left) / spr.width) * 100))
              const py = Math.max(5, Math.min(95, ((ev.clientY - spr.top)  / spr.height) * 100))
              onTransferToSibling({ x: px, y: py })
              return
            }
          }
          // No sibling matched — eject to floating
          const bx = ((ev.clientX - br.left) / br.width)  * 100
          const by = ((ev.clientY - br.top)  / br.height) * 100
          onEject?.({ x: bx, y: by })
          return
        }
      }

      // Inject: floating photo released inside a page (check primary page then sibling)
      if (coordinateSystem === 'book') {
        for (const [ref, cb] of [[pageRef, onInject], [siblingPageRef, onTransferToSibling]]) {
          if (ref?.current && cb) {
            const pr = ref.current.getBoundingClientRect()
            const inside = ev.clientX >= pr.left && ev.clientX <= pr.right
                        && ev.clientY >= pr.top  && ev.clientY <= pr.bottom
            if (inside) {
              const px = Math.max(5, Math.min(95, ((ev.clientX - pr.left) / pr.width)  * 100))
              const py = Math.max(5, Math.min(95, ((ev.clientY - pr.top)  / pr.height) * 100))
              cb({ x: px, y: py })
              return
            }
          }
        }
      }

      // Page photos: clamp inside page bounds. Floating photos: no clamp.
      onUpdate({
        x: coordinateSystem === 'page' ? Math.max(0, Math.min(100, currentX)) : currentX,
        y: coordinateSystem === 'page' ? Math.max(0, Math.min(100, currentY)) : currentY,
      })
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [isEditing, photo.x, photo.y, coordinateSystem, containerRef, pageRef, siblingPageRef, bookRef, onSelect, onUpdate, onEject, onInject, onTransferToSibling])

  // ---- Resize ----
  const handleResizeStart = useCallback((e) => {
    e.stopPropagation()
    e.preventDefault()

    const wrapper = wrapperRef.current
    if (!wrapper) return
    const rect = wrapper.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top  + rect.height / 2
    const initDist  = Math.hypot(e.clientX - cx, e.clientY - cy)
    const initScale = photo.scale
    let lastScale = initScale

    const onMove = (ev) => {
      const dist = Math.hypot(ev.clientX - cx, ev.clientY - cy)
      lastScale = Math.max(0.2, Math.min(5, (dist / initDist) * initScale))
      setScaleVisual(lastScale)
    }
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      setScaleVisual(null)
      onUpdate({ scale: lastScale })
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
    const cy = rect.top  + rect.height / 2
    let lastAngle = photo.rotation

    const onMove = (ev) => {
      lastAngle = Math.round(Math.atan2(ev.clientY - cy, ev.clientX - cx) * (180 / Math.PI) + 90)
      setRotVisual(lastAngle)
    }
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      setRotVisual(null)
      onUpdate({ rotation: lastAngle })
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [photo.rotation, onUpdate])

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
        left: `${dispX}%`,
        top:  `${dispY}%`,
        width: `${photo.width}%`,
        transform: `translate(-50%, -50%) scale(${dispSc}) rotate(${dispRot}deg)`,
        cursor: isEditing ? (isSelected ? 'move' : 'pointer') : 'default',
        zIndex: isSelected ? 15 : 10,
      }}
      onMouseDown={isEditing ? handleDragStart : undefined}
      onClick={isEditing ? (e) => { e.stopPropagation(); onSelect() } : undefined}
    >
      {/* Frame + handles */}
      <div className={`${styles.inner} ${isSelected ? styles.selected : ''}`}>
        <div className={styles.frame}>
          <img src={photo.src} alt={photo.caption || ''} draggable={false} />
        </div>

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

      {/* Caption — absolutely positioned so it doesn't affect wrapper height/centering */}
      {isEditing ? (
        <div className={styles.captionArea} onMouseDown={(e) => e.stopPropagation()}>
          {editingCaption ? (
            <textarea
              className={styles.captionTextarea}
              value={captionDraft}
              autoFocus
              onChange={(e) => setCaptionDraft(e.target.value)}
              onBlur={commitCaption}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitCaption() }
              }}
            />
          ) : (
            <p
              className={styles.captionText}
              onClick={(e) => { e.stopPropagation(); setEditingCaption(true) }}
            >
              {photo.caption
                ? photo.caption
                : <span className={styles.captionPlaceholder}>Подпись...</span>
              }
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
