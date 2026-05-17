import { useNavigate } from 'react-router-dom'
import styles from './AlbumCard.module.css'

export default function AlbumCard({ album, onDelete }) {
  const navigate = useNavigate()
  const coverPhoto = album.pages[0]?.photos?.[0]?.src || null
  const pageCount = album.pages.length

  return (
    <div className={styles.card}>
      {coverPhoto ? (
        <img className={styles.cover} src={coverPhoto} alt="Обложка" />
      ) : (
        <div className={styles.coverEmpty}>Нет фотографий</div>
      )}
      <div className={styles.body}>
        <div className={styles.title}>{album.title}</div>
        <div className={styles.meta}>
          {pageCount} {pluralPages(pageCount)} · {formatDate(album.createdAt)}
        </div>
        <div className={styles.actions}>
          <button className={styles.btnEdit} onClick={() => navigate(`/album/${album.id}/view`)}>
            Открыть
          </button>
          <button
            className={styles.btnDelete}
            onClick={(e) => {
              e.stopPropagation()
              onDelete(album.id)
            }}
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}

function pluralPages(n) {
  if (n % 10 === 1 && n % 100 !== 11) return 'страница'
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return 'страницы'
  return 'страниц'
}

function formatDate(ts) {
  return new Date(ts).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}
