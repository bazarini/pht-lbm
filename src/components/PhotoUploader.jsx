import styles from './PhotoUploader.module.css'

export default function PhotoUploader({ photo, onChange }) {
  function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => onChange(ev.target.result)
    reader.readAsDataURL(file)
  }

  return (
    <div className={styles.uploader}>
      {photo ? (
        <div className={styles.preview}>
          <img src={photo} alt="Фото страницы" className={styles.image} />
          <button className={styles.remove} onClick={() => onChange(null)} title="Удалить фото">✕</button>
        </div>
      ) : (
        <label className={styles.dropzone}>
          <span className={styles.icon}>📷</span>
          <span className={styles.hint}>Нажмите для загрузки фото</span>
          <input type="file" accept="image/*" hidden onChange={handleFile} />
        </label>
      )}
    </div>
  )
}
