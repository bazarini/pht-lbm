import { create } from 'zustand'
import * as db from '../services/db'

const useAlbumStore = create((set, get) => ({
  albums: [],
  loading: false,

  // ---- Fetch ----
  fetchAlbums: async (userId) => {
    set({ loading: true })
    try {
      const albums = await db.getAlbums(userId)
      set({ albums, loading: false })
    } catch (err) {
      console.error('fetchAlbums:', err)
      set({ loading: false })
    }
  },

  // ---- Create ----
  createAlbum: async (userId) => {
    const albumData = {
      title: 'Новый альбом',
      pages: [{ id: crypto.randomUUID(), photos: [] }],
      floatingPhotos: [],
    }
    try {
      const album = await db.createAlbum(userId, albumData)
      set((s) => ({ albums: [album, ...s.albums] }))
      return album
    } catch (err) {
      console.error('createAlbum:', err)
      return null
    }
  },

  // ---- Delete (optimistic) ----
  deleteAlbum: async (id) => {
    set((s) => ({ albums: s.albums.filter((a) => a.id !== id) }))
    try {
      await db.deleteAlbum(id)
    } catch (err) {
      console.error('deleteAlbum:', err)
    }
  },

  // ---- Update (optimistic) ----
  updateAlbum: async (id, patch) => {
    set((s) => ({
      albums: s.albums.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    }))
    try {
      await db.updateAlbum(id, patch)
    } catch (err) {
      console.error('updateAlbum:', err)
    }
  },

  // ---- Selectors ----
  getAlbum: (id) => get().albums.find((a) => a.id === id) || null,
  getUserAlbums: (userId) => get().albums.filter((a) => a.userId === userId),
}))

export default useAlbumStore
