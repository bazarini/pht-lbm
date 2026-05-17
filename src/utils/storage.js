// NOTE: Auth (getUsers/saveUsers/getSession etc.) has been removed —
// authentication is now handled by Supabase Auth via src/services/auth.js.
// Album storage (getAlbums/saveAlbums) will be removed once the
// feat/supabase-integration branch is merged.

const KEYS = {
  ALBUMS: 'pb_albums',
}

// Migrate albums from old format (page.photo) to new format (page.photos[])
function migrateAlbums(albums) {
  return albums.map((album) => ({
    ...album,
    floatingPhotos: album.floatingPhotos ?? [],
    pages: (album.pages ?? []).map((page) => {
      if (page.photos) return page
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
