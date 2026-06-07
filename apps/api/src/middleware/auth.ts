import type { Context, Next } from 'hono'
import { WorkOS } from '@workos-inc/node'
import type { AppEnv, AuthUser } from '../env'

const wosCache = new Map<string, WorkOS>()

function getWorkOS(apiKey: string | undefined): WorkOS | null {
  if (!apiKey || apiKey.startsWith('sk_test_REPLACE')) return null
  if (!wosCache.has(apiKey)) wosCache.set(apiKey, new WorkOS(apiKey))
  return wosCache.get(apiKey)!
}

export async function authMiddleware(c: Context<AppEnv>, next: Next) {
  const requireAuth = c.env.REQUIRE_AUTH === 'true'
  const wos = getWorkOS(c.env.WORKOS_API_KEY)

  if (!wos || !requireAuth) {
    c.set('user', {
      id: 'dev-user-1',
      email: 'dev@vc.local',
      firstName: 'Dev',
      lastName: 'User',
      organizationId: 'org-dev',
    })
    return next()
  }

  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: { code: 'UNAUTHORIZED', message: 'Missing authorization token' } }, 401)
  }

  const token = authHeader.slice(7)
  try {
    const parts = token.split('.')
    if (parts.length !== 3) throw new Error('Invalid token format')
    // Decode JWT payload to get userId (sub claim)
    const payload = JSON.parse(atob(parts[1]!.replace(/-/g, '+').replace(/_/g, '/'))) as { sub?: string }
    const userId = payload.sub
    if (!userId) throw new Error('Missing sub claim')
    const user = await wos.userManagement.getUser(userId)
    c.set('user', {
      id: user.id,
      email: user.email,
      firstName: user.firstName ?? undefined,
      lastName: user.lastName ?? undefined,
      organizationId: undefined,
    })
    return next()
  } catch {
    return c.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' } }, 401)
  }
}

export function requireRole(_role: 'analyst' | 'principal' | 'partner' | 'admin') {
  return async (c: Context<AppEnv>, next: Next) => {
    const user = c.get('user')
    if (!user) return c.json({ error: { code: 'FORBIDDEN', message: 'Access denied' } }, 403)
    return next()
  }
}

export type { AuthUser }
