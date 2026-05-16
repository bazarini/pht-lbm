import { create } from 'zustand'
import { getUsers, saveUsers, getSession, saveSession, clearSession } from '../utils/storage'

const useAuthStore = create((set) => ({
  user: getSession(),

  register: (email, password) => {
    const users = getUsers()
    if (users.find((u) => u.email === email)) {
      return { error: 'Пользователь с таким email уже существует' }
    }
    const newUser = { id: crypto.randomUUID(), email, password }
    saveUsers([...users, newUser])
    const session = { id: newUser.id, email: newUser.email }
    saveSession(session)
    set({ user: session })
    return { ok: true }
  },

  login: (email, password) => {
    const users = getUsers()
    const found = users.find((u) => u.email === email && u.password === password)
    if (!found) {
      return { error: 'Неверный email или пароль' }
    }
    const session = { id: found.id, email: found.email }
    saveSession(session)
    set({ user: session })
    return { ok: true }
  },

  logout: () => {
    clearSession()
    set({ user: null })
  },
}))

export default useAuthStore
