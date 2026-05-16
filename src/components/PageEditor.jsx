import PhotoUploader from './PhotoUploader'
import styles from './PageEditor.module.css'

export default function PageEditor({ page, index, onChange, onDelete }) {
  function update(patch) {
    onChange({ ...page, ...patch })
  }

  return (
    <div className={styles.page}>
      <div className={styles.number}>{index + 1}</div>
      <div className={styles.content}>
        <PhotoUploader photo={page.photo} onChange={(photo) => update({ photo })} />
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
