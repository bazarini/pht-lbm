import { useParams, useNavigate } from 'react-router-dom'
import useAlbumStore from '../store/albumStore'
import BookViewer from '../components/BookViewer'
import styles from './ViewerPage.module.css'

export default function ViewerPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const getAlbum = useAlbumStore((s) => s.getAlbum)
  const album = getAlbum(id)

  if (!album) {
    return <div className={styles.notFound}>Альбом не найден</div>
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.btnBack} onClick={() => navigate('/')} title="На главную">
            ←
          </button>
          <span className={styles.title}>{album.title}</span>
        </div>
        <button className={styles.btnEdit} onClick={() => navigate(`/album/${id}/edit`)}>
          Редактировать
        </button>
      </header>

      <div className={styles.viewer}>
        <BookViewer album={album} />
      </div>
    </div>
  )
}
