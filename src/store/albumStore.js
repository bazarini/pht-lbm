import { create } from 'zustand'
import { getAlbums, saveAlbums } from '../utils/storage'

const useAlbumStore = create((set, get) => ({
  albums: getAlbums(),

  _persist: (albums) => {
    saveAlbums(albums)
    set({ albums })
  },

  createAlbum: (userId) => {
    const album = {
      id: crypto.randomUUID(),
      userId,
      title: 'Новый альбом',
      pages: [],
      floatingPhotos: [],
      createdAt: Date.now(),
    }
    const albums = [...get().albums, album]
    get()._persist(albums)
    return album
  },

  deleteAlbum: (id) => {
    const albums = get().albums.filter((a) => a.id !== id)
    get()._persist(albums)
  },

  updateAlbum: (id, patch) => {
    const albums = get().albums.map((a) => (a.id === id ? { ...a, ...patch } : a))
    get()._persist(albums)
  },

  getAlbum: (id) => get().albums.find((a) => a.id === id) || null,

  getUserAlbums: (userId) => get().albums.filter((a) => a.userId === userId),
}))

export default useAlbumStore
