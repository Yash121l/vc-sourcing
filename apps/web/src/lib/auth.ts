const API_URL = import.meta.env['VITE_API_URL'] ?? 'http://localhost:3001'
const TOKEN_KEY = 'vc_access_token'

export interface AuthUser {
  id: string
  email: string
  firstName?: string
  lastName?: string
  organizationId?: string
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export function getAuthHeaders(): HeadersInit {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function getAuthUrl(): Promise<string | null> {
  const res = await fetch(`${API_URL}/api/auth/url`)
  const json = await res.json() as { data: { url: string | null; dev_mode?: boolean } }
  return json.data.url
}

export async function handleCallback(code: string): Promise<{ user: AuthUser; token: string }> {
  const res = await fetch(`${API_URL}/api/auth/callback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  })
  if (!res.ok) throw new Error('Authentication failed')
  const json = await res.json() as { data: { access_token: string; user: AuthUser } }
  setToken(json.data.access_token)
  return { user: json.data.user, token: json.data.access_token }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = getToken()
  if (!token) return null
  try {
    const res = await fetch(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) { clearToken(); return null }
    const json = await res.json() as { data: { user: AuthUser } }
    return json.data.user
  } catch {
    return null
  }
}

export async function signOut() {
  const token = getToken()
  if (token) {
    await fetch(`${API_URL}/api/auth/signout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {})
  }
  clearToken()
}

export function isDevMode(): boolean {
  return import.meta.env['VITE_APP_ENV'] !== 'production'
}
