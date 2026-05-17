import { create } from 'zustand'
import * as auth from '../services/auth'

const useAuthStore = create((set) => {
  // Bootstrap: load existing session, then subscribe to future changes.
  // Both run once when the store is first created.
  auth.getSession().then((user) => set({ user, loading: false }))

  const unsubscribe = auth.onAuthChange((user) => set({ user, loading: false }))
  // unsubscribe is intentionally not called — the store lives for the app lifetime.
  void unsubscribe

  return {
    user: null,
    loading: true, // true until getSession() resolves

    signUp: async (email, password) => {
      const result = await auth.signUp(email, password)
      if (result.error) return result
      if (!result.needsConfirmation) set({ user: result.user })
      return result
    },

    signIn: async (email, password) => {
      const result = await auth.signIn(email, password)
      if (result.error) return result
      set({ user: result.user })
      return result
    },

    signInWithGoogle: () => auth.signInWithGoogle(),

    signOut: async () => {
      await auth.signOut()
      set({ user: null })
    },

    // Legacy alias used in DashboardPage — will be cleaned up when supabase-integration merges
    logout: async () => {
      await auth.signOut()
      set({ user: null })
    },
  }
})

export default useAuthStore
