import { useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import useAlbumStore from '../store/albumStore'
import PageEditor from '../components/PageEditor'
import styles from './EditorPage.module.css'

export default function EditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const getAlbum = useAlbumStore((s) => s.getAlbum)
  const updateAlbum = useAlbumStore((s) => s.updateAlbum)
  const albums = useAlbumStore((s) => s.albums)
  const saveTimer = useRef(null)

  const album = getAlbum(id)

  if (!album) {
    return <div className={styles.notFound}>Альбом не найден</div>
  }

  function setTitle(title) {
    updateAlbum(id, { title })
  }

  function setPages(pages) {
    updateAlbum(id, { pages })
  }

  function addPage() {
    setPages([...album.pages, { id: crypto.randomUUID(), photo: null, caption: '', photoX: 50, photoY: 50 }])
  }

  function updatePage(index, page) {
    const pages = album.pages.map((p, i) => (i === index ? page : p))
    setPages(pages)
  }

  function deletePage(index) {
    setPages(album.pages.filter((_, i) => i !== index))
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.btnBack} onClick={() => navigate('/')} title="На главную">
            ←
          </button>
          <input
            className={styles.titleInput}
            value={album.title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Название альбома"
          />
        </div>
        <div className={styles.headerRight}>
          <span className={styles.saved}>Сохранено</span>
          <button className={styles.btnView} onClick={() => navigate(`/album/${id}/view`)}>
            Смотреть →
          </button>
        </div>
      </header>

      <main className={styles.main}>
        {album.pages.map((page, index) => (
          <PageEditor
            key={page.id}
            page={page}
            index={index}
            onChange={(updated) => updatePage(index, updated)}
            onDelete={() => deletePage(index)}
          />
        ))}
        <button className={styles.btnAddPage} onClick={addPage}>
          + Добавить страницу
        </button>
      </main>
    </div>
  )
}
