/**
 * db.js — abstraction layer over Supabase.
 * No other file should import from supabaseClient directly.
 * Swap this file to migrate to a different backend.
 */
import { supabase } from './supabaseClient'

// ─── Image compression ──────────────────────────────────────────────────────

/**
 * Resize + compress a File/Blob to JPEG before upload.
 * @param {File} file
 * @param {number} maxPx   longest side in pixels (default 1200)
 * @param {number} quality JPEG quality 0–1 (default 0.75)
 * @returns {Promise<Blob>}
 */
async function compressImage(file, maxPx = 1200, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height))
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Canvas toBlob failed'))),
        'image/jpeg',
        quality
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Image load failed'))
    }

    img.src = objectUrl
  })
}

// ─── Photo upload ────────────────────────────────────────────────────────────

/**
 * Compress and upload a photo to Supabase Storage.
 * @param {File} file
 * @returns {Promise<string>} Public URL of the uploaded photo
 */
export async function uploadPhoto(file) {
  const compressed = await compressImage(file)
  const path = `${crypto.randomUUID()}.jpg`

  const { error: uploadError } = await supabase.storage
    .from('photos')
    .upload(path, compressed, { contentType: 'image/jpeg', upsert: false })

  if (uploadError) throw uploadError

  const { data } = supabase.storage.from('photos').getPublicUrl(path)
  return data.publicUrl
}

// ─── Albums CRUD ─────────────────────────────────────────────────────────────

function rowToAlbum(row) {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    pages: row.pages ?? [],
    floatingPhotos: row.floating_photos ?? [],
    createdAt: row.created_at,
  }
}

/** Fetch all albums for a user, newest first. */
export async function getAlbums(userId) {
  const { data, error } = await supabase
    .from('albums')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data.map(rowToAlbum)
}

/** Create a new album row and return the full album object. */
export async function createAlbum(userId, albumData) {
  const { data, error } = await supabase
    .from('albums')
    .insert({
      user_id: userId,
      title: albumData.title,
      pages: albumData.pages,
      floating_photos: albumData.floatingPhotos,
    })
    .select()
    .single()

  if (error) throw error
  return rowToAlbum(data)
}

/**
 * Patch an existing album.
 * Only sends the fields present in `patch`.
 */
export async function updateAlbum(id, patch) {
  const row = {}
  if (patch.title !== undefined)          row.title = patch.title
  if (patch.pages !== undefined)          row.pages = patch.pages
  if (patch.floatingPhotos !== undefined) row.floating_photos = patch.floatingPhotos

  if (Object.keys(row).length === 0) return // nothing to update

  const { error } = await supabase.from('albums').update(row).eq('id', id)
  if (error) throw error
}

/** Delete an album row. */
export async function deleteAlbum(id) {
  const { error } = await supabase.from('albums').delete().eq('id', id)
  if (error) throw error
}
