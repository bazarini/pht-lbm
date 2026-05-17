/**
 * auth.js — abstraction layer over the auth provider (currently Supabase Auth).
 * No other file imports from supabaseClient directly for auth purposes.
 * To swap the provider, rewrite only this file.
 *
 * Public surface:
 *   signUp(email, password)   → { user, needsConfirmation } | { error }
 *   signIn(email, password)   → { user } | { error }
 *   signInWithGoogle()        → void (redirects browser)
 *   signOut()                 → void
 *   getSession()              → User | null
 *   onAuthChange(cb)          → unsubscribe fn
 *
 * User shape: { id: string, email: string }
 */
import { supabase } from './supabaseClient'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalize(supabaseUser) {
  if (!supabaseUser) return null
  return { id: supabaseUser.id, email: supabaseUser.email }
}

const ERRORS = {
  'Invalid login credentials':      'Неверный email или пароль',
  'Email not confirmed':            'Подтвердите email перед входом',
  'User already registered':        'Пользователь с таким email уже зарегистрирован',
  'Password should be at least':    'Пароль должен содержать минимум 6 символов',
  'Unable to validate email':       'Некорректный email',
  'Email rate limit exceeded':      'Слишком много попыток, подождите немного',
}

function translateError(message = '') {
  for (const [key, ru] of Object.entries(ERRORS)) {
    if (message.includes(key)) return ru
  }
  return message
}

// ─── API ─────────────────────────────────────────────────────────────────────

export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) return { error: translateError(error.message) }
  return {
    user: normalize(data.user),
    // Supabase requires email confirmation by default — session is null until confirmed
    needsConfirmation: !data.session,
  }
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: translateError(error.message) }
  return { user: normalize(data.user) }
}

/**
 * Initiates Google OAuth flow. Redirects the browser to Google;
 * on return Supabase fires onAuthStateChange automatically.
 */
export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  })
  if (error) throw error
}

export async function signOut() {
  await supabase.auth.signOut()
}

/** Returns the currently logged-in user or null (async, reads from storage). */
export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return normalize(data.session?.user ?? null)
}

/**
 * Subscribe to auth state changes.
 * `callback` receives a User | null on every sign-in / sign-out.
 * Returns an unsubscribe function.
 */
export function onAuthChange(callback) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(normalize(session?.user ?? null))
  })
  return () => subscription.unsubscribe()
}
