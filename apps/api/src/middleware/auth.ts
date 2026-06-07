import type { Context, Next } from 'hono'
import { WorkOS } from '@workos-inc/node'

let workos: WorkOS | null = null

function getWorkOS() {
  if (!workos) {
    const key = process.env['WORKOS_API_KEY']
    if (!key || key.startsWith('sk_test_REPLACE')) return null
    workos = new WorkOS(key)
  }
  return workos
}

export interface AuthUser {
  id: string
  email: string
  firstName?: string | undefined
  lastName?: string | undefined
  organizationId?: string | undefined
}

declare module 'hono' {
  interface ContextVariableMap {
    user: AuthUser | null
  }
}

export async function authMiddleware(c: Context, next: Next) {
  // Skip auth in dev if REQUIRE_AUTH is not set
  const requireAuth = process.env['REQUIRE_AUTH'] === 'true'
  const wos = getWorkOS()

  if (!wos || !requireAuth) {
    // Development mode: no auth required — set mock user
    c.set('user', {
      id: 'dev-user-1',
      email: 'dev@vc.local',
      firstName: 'Dev',
      lastName: 'User',
      organizationId: process.env['DEFAULT_ORGANIZATION_ID'] ?? 'org-dev',
    })
    return next()
  }

  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: { code: 'UNAUTHORIZED', message: 'Missing authorization token' } }, 401)
  }

  const token = authHeader.slice(7)

  try {
    const { sealedSession } = await wos.userManagement.authenticateWithSessionToken({
      token,
      clientId: process.env['WORKOS_CLIENT_ID'] ?? '',
    })
    // For WorkOS AuthKit, verify the session
    const session = await wos.userManagement.getSession({ sessionId: token })
    c.set('user', {
      id: session.userId,
      email: session.user?.email ?? '',
      firstName: session.user?.firstName ?? undefined,
      lastName: session.user?.lastName ?? undefined,
      organizationId: session.organizationId ?? undefined,
    })
    return next()
  } catch {
    return c.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' } }, 401)
  }
}

export function requireRole(_role: 'analyst' | 'principal' | 'partner' | 'admin') {
  return async (c: Context, next: Next) => {
    // Role checking — implement with WorkOS RBAC or your own logic
    // For now, allow all authenticated users
    const user = c.get('user')
    if (!user) {
      return c.json({ error: { code: 'FORBIDDEN', message: 'Access denied' } }, 403)
    }
    return next()
  }
}
