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

export function getAlbums() {
  return JSON.parse(localStorage.getItem(KEYS.ALBUMS) || '[]')
}

export function saveAlbums(albums) {
  localStorage.setItem(KEYS.ALBUMS, JSON.stringify(albums))
}
