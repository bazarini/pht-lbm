import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import useAlbumStore from '../store/albumStore'
import AlbumCard from '../components/AlbumCard'
import styles from './DashboardPage.module.css'

export default function DashboardPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  const loading = useAlbumStore((s) => s.loading)
  const fetchAlbums = useAlbumStore((s) => s.fetchAlbums)
  const createAlbum = useAlbumStore((s) => s.createAlbum)
  const deleteAlbum = useAlbumStore((s) => s.deleteAlbum)
  const getUserAlbums = useAlbumStore((s) => s.getUserAlbums)

  useEffect(() => {
    if (user?.id) fetchAlbums(user.id)
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const albums = getUserAlbums(user.id)

  async function handleCreate() {
    const album = await createAlbum(user.id)
    if (album) navigate(`/album/${album.id}/view`)
  }

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.logo}>PhotoBook</div>
        <div className={styles.headerRight}>
          <span className={styles.userEmail}>{user.email}</span>
          <button className={styles.btnLogout} onClick={handleLogout}>
            Выйти
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.toolbar}>
          <h1 className={styles.heading}>Мои альбомы</h1>
          <button className={styles.btnCreate} onClick={handleCreate} disabled={loading}>
            + Создать альбом
          </button>
        </div>

        {loading && albums.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>Загрузка…</p>
          </div>
        ) : albums.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>Пока нет альбомов</p>
            <p className={styles.emptyText}>Создайте первый альбом и наполните его воспоминаниями</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {albums.map((album) => (
              <AlbumCard key={album.id} album={album} onDelete={deleteAlbum} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
