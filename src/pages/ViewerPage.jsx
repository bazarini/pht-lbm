import { useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import useAlbumStore from '../store/albumStore'
import BookViewer from '../components/BookViewer'
import { uploadPhoto } from '../services/db'
import styles from './ViewerPage.module.css'

export default function ViewerPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const getAlbum = useAlbumStore((s) => s.getAlbum)
  const updateAlbum = useAlbumStore((s) => s.updateAlbum)
  const albums = useAlbumStore((s) => s.albums) // subscribe for reactivity

  const album = getAlbum(id)

  const [isEditing, setIsEditing] = useState(false)
  const [history, setHistory] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  if (!album) {
    return <div className={styles.notFound}>Альбом не найден</div>
  }

  // ---- History ----
  const snapshot = useCallback(() => ({
    pages: album.pages,
    floatingPhotos: album.floatingPhotos ?? [],
  }), [album])

  const saveHistory = useCallback(() => {
    setHistory((h) => [...h.slice(-20), snapshot()])
  }, [snapshot])

  const undo = useCallback(() => {
    if (!history.length) return
    updateAlbum(id, history.at(-1))
    setHistory((h) => h.slice(0, -1))
  }, [history, id, updateAlbum])

  // ---- Add photo ----
  function halfUsage(photos, half) {
    return (photos ?? [])
      .filter((ph) => (half === 'top' ? ph.y < 50 : ph.y >= 50))
      .reduce((acc, ph) => acc + ph.width * ph.scale, 0)
  }

  function findInsertTarget(pages) {
    for (let i = 0; i < pages.length; i++) {
      const photos = pages[i].photos ?? []
      if (halfUsage(photos, 'top') < 50) return { pageIdx: i, x: 50, y: 25 }
      if (halfUsage(photos, 'bottom') < 50) return { pageIdx: i, x: 50, y: 75 }
    }
    return null
  }

  async function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    e.target.value = ''

    setUploading(true)
    try {
      const src = await uploadPhoto(file)
      saveHistory()
      const newPhoto = {
        id: crypto.randomUUID(),
        src,
        caption: '',
        scale: 1.0,
        rotation: 0,
        width: 40,
      }
      const pages = album.pages
      const target = findInsertTarget(pages)
      if (target) {
        const updatedPages = pages.map((p, i) =>
          i !== target.pageIdx ? p : {
            ...p,
            photos: [...(p.photos ?? []), { ...newPhoto, x: target.x, y: target.y }],
          }
        )
        updateAlbum(id, { pages: updatedPages })
      } else {
        // No space → floating
        const floating = { ...newPhoto, x: 50, y: 50, width: 20 }
        updateAlbum(id, {
          floatingPhotos: [...(album.floatingPhotos ?? []), floating],
        })
      }
    } catch (err) {
      console.error('Upload failed:', err)
      alert('Ошибка загрузки фото: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  // ---- Update / delete page photo ----
  const handleUpdatePagePhoto = useCallback((pageIdx, photoId, patch) => {
    saveHistory()
    const pages = album.pages.map((p, i) =>
      i !== pageIdx ? p : {
        ...p,
        photos: p.photos.map((ph) => (ph.id === photoId ? { ...ph, ...patch } : ph)),
      }
    )
    updateAlbum(id, { pages })
  }, [album, id, updateAlbum, saveHistory])

  const handleDeletePagePhoto = useCallback((pageIdx, photoId) => {
    saveHistory()
    const pages = album.pages.map((p, i) =>
      i !== pageIdx ? p : { ...p, photos: p.photos.filter((ph) => ph.id !== photoId) }
    )
    updateAlbum(id, { pages })
    setSelectedId(null)
  }, [album, id, updateAlbum, saveHistory])

  // ---- Update / delete floating photo ----
  const handleUpdateFloating = useCallback((photoId, patch) => {
    saveHistory()
    const floatingPhotos = (album.floatingPhotos ?? []).map((ph) =>
      ph.id === photoId ? { ...ph, ...patch } : ph
    )
    updateAlbum(id, { floatingPhotos })
  }, [album, id, updateAlbum, saveHistory])

  const handleDeleteFloating = useCallback((photoId) => {
    saveHistory()
    const floatingPhotos = (album.floatingPhotos ?? []).filter((ph) => ph.id !== photoId)
    updateAlbum(id, { floatingPhotos })
    setSelectedId(null)
  }, [album, id, updateAlbum, saveHistory])

  // ---- Transfer (page → sibling page) ----
  const handleTransferPagePhoto = useCallback((fromPageIdx, toPageIdx, photoId, coords) => {
    saveHistory()
    const photo = album.pages[fromPageIdx]?.photos?.find((ph) => ph.id === photoId)
    if (!photo) return
    const pages = album.pages.map((p, i) => {
      if (i === fromPageIdx) return { ...p, photos: p.photos.filter((ph) => ph.id !== photoId) }
      if (i === toPageIdx)   return { ...p, photos: [...(p.photos ?? []), { ...photo, x: coords.x, y: coords.y }] }
      return p
    })
    updateAlbum(id, { pages })
  }, [album, id, updateAlbum, saveHistory])

  // ---- Eject (page → floating) ----
  const handleEjectPhoto = useCallback((pageIdx, photoId, bookCoords) => {
    saveHistory()
    const page = album.pages[pageIdx]
    const photo = page?.photos?.find((ph) => ph.id === photoId)
    if (!photo) return
    const floating = {
      ...photo,
      x: bookCoords.x,
      y: bookCoords.y,
      width: Math.max(10, photo.width * 0.5),
    }
    const pages = album.pages.map((p, i) =>
      i !== pageIdx ? p : { ...p, photos: p.photos.filter((ph) => ph.id !== photoId) }
    )
    updateAlbum(id, {
      pages,
      floatingPhotos: [...(album.floatingPhotos ?? []), floating],
    })
  }, [album, id, updateAlbum, saveHistory])

  // ---- Inject (floating → page) ----
  const handleInjectPhoto = useCallback((photoId, pageIdx, pageCoords) => {
    saveHistory()
    const photo = (album.floatingPhotos ?? []).find((ph) => ph.id === photoId)
    if (!photo) return
    const pagePhoto = {
      ...photo,
      x: pageCoords.x,
      y: pageCoords.y,
      width: Math.min(80, photo.width * 2),
    }
    const floatingPhotos = (album.floatingPhotos ?? []).filter((ph) => ph.id !== photoId)
    const pages = album.pages.map((p, i) =>
      i !== pageIdx ? p : { ...p, photos: [...(p.photos ?? []), pagePhoto] }
    )
    updateAlbum(id, { pages, floatingPhotos })
  }, [album, id, updateAlbum, saveHistory])

  // ---- Next spread (auto-create pages) ----
  const handleNextSpread = useCallback(() => {
    saveHistory()
    updateAlbum(id, {
      pages: [
        ...album.pages,
        { id: crypto.randomUUID(), photos: [] },
        { id: crypto.randomUUID(), photos: [] },
      ],
    })
  }, [album, id, updateAlbum, saveHistory])

  // ---- Toggle edit mode ----
  function toggleEdit() {
    setIsEditing((v) => {
      if (v) setSelectedId(null)
      return !v
    })
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.btnBack} onClick={() => navigate('/')}>←</button>
          {isEditing ? (
            <input
              className={styles.titleInput}
              value={album.title}
              onChange={(e) => updateAlbum(id, { title: e.target.value })}
              placeholder="Название альбома"
            />
          ) : (
            <span className={styles.title}>{album.title}</span>
          )}
        </div>

        <div className={styles.headerActions}>
          {isEditing && (
            <>
              <button
                className={styles.btnAction}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? 'Загрузка…' : '+ Фото'}
              </button>
              <input
                type="file"
                accept="image/*"
                hidden
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              <button
                className={styles.btnAction}
                onClick={undo}
                disabled={!history.length}
                title="Отменить"
              >
                ↩ Отменить
              </button>
            </>
          )}
          <button
            className={`${styles.btnToggle} ${isEditing ? styles.btnToggleActive : ''}`}
            onClick={toggleEdit}
          >
            {isEditing ? '✎ Редактирование' : '◎ Просмотр'}
          </button>
        </div>
      </header>

      <div className={styles.viewer}>
        <BookViewer
          album={album}
          isEditing={isEditing}
          selectedId={selectedId}
          onSelectPhoto={setSelectedId}
          onUpdatePagePhoto={handleUpdatePagePhoto}
          onUpdateFloating={handleUpdateFloating}
          onDeletePagePhoto={handleDeletePagePhoto}
          onDeleteFloating={handleDeleteFloating}
          onEjectPhoto={handleEjectPhoto}
          onInjectPhoto={handleInjectPhoto}
          onTransferPagePhoto={handleTransferPagePhoto}
          onNextSpread={handleNextSpread}
        />
      </div>
    </div>
  )
}
