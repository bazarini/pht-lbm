const KEYS = {
  USERS: 'pb_users',
  SESSION: 'pb_session',
  ALBUMS: 'pb_albums',
}

export function getUsers() {
  return JSON.parse(localStorage.getItem(KEYS.USERS) || '[]')
}

export function saveUsers(users) {
  localStorage.setItem(KEYS.USERS, JSON.stringify(users))
}

export function getSession() {
  return JSON.parse(localStorage.getItem(KEYS.SESSION) || 'null')
}

export function saveSession(user) {
  localStorage.setItem(KEYS.SESSION, JSON.stringify(user))
}

export function clearSession() {
  localStorage.removeItem(KEYS.SESSION)
}

// Migrate albums from old format (page.photo) to new format (page.photos[])
function migrateAlbums(albums) {
  return albums.map((album) => ({
    ...album,
    floatingPhotos: album.floatingPhotos ?? [],
    pages: (album.pages ?? []).map((page) => {
      if (page.photos) return page // already new format
      return {
        id: page.id,
        photos: page.photo
          ? [{
              id: crypto.randomUUID(),
              src: page.photo,
              caption: page.caption ?? '',
              x: page.photoX ?? 50,
              y: page.photoY ?? 50,
              scale: 1.0,
              rotation: 0,
              width: 40,
            }]
          : [],
      }
    }),
  }))
}

export function getAlbums() {
  const raw = JSON.parse(localStorage.getItem(KEYS.ALBUMS) || '[]')
  return migrateAlbums(raw)
}

export function saveAlbums(albums) {
  localStorage.setItem(KEYS.ALBUMS, JSON.stringify(albums))
}
