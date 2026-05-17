import { Navigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'

export default function AuthGuard({ children }) {
  const user    = useAuthStore((s) => s.user)
  const loading = useAuthStore((s) => s.loading)

  // Wait for Supabase to restore the session before deciding.
  // Without this, users get flashed to /login on every hard refresh.
  if (loading) return null

  if (!user) return <Navigate to="/login" replace />
  return children
}
