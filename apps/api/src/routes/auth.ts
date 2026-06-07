import { Hono } from 'hono'
import { WorkOS } from '@workos-inc/node'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'

const auth = new Hono()

function getWorkOS() {
  const key = process.env['WORKOS_API_KEY']
  const clientId = process.env['WORKOS_CLIENT_ID']
  if (!key || !clientId || key.startsWith('sk_test_REPLACE')) return null
  return { wos: new WorkOS(key), clientId }
}

// Get auth URL — redirect user to WorkOS login
auth.get('/url', (c) => {
  const ctx = getWorkOS()
  if (!ctx) {
    return c.json({ data: { url: null, dev_mode: true, message: 'Auth disabled in dev mode. Set WORKOS_API_KEY to enable.' } })
  }
  const { url } = ctx.wos.userManagement.getAuthorizationUrl({
    clientId: ctx.clientId,
    redirectUri: `${process.env['WEB_URL'] ?? 'http://localhost:5173'}/auth/callback`,
    provider: 'authkit',
  })
  return c.json({ data: { url } })
})

// Handle OAuth callback
auth.post('/callback', zValidator('json', z.object({ code: z.string() })), async (c) => {
  const ctx = getWorkOS()
  if (!ctx) {
    // Dev mode — return mock session
    return c.json({
      data: {
        access_token: 'dev-token',
        user: { id: 'dev-user-1', email: 'dev@vc.local', firstName: 'Dev', lastName: 'User' },
      },
    })
  }

  const { code } = c.req.valid('json')
  try {
    const { accessToken, user } = await ctx.wos.userManagement.authenticateWithCode({
      clientId: ctx.clientId,
      code,
    })
    return c.json({ data: { access_token: accessToken, user } })
  } catch {
    return c.json({ error: { code: 'AUTH_FAILED', message: 'Authentication failed' } }, 401)
  }
})

// Get current user
auth.get('/me', async (c) => {
  const user = c.get('user')
  if (!user) return c.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, 401)
  return c.json({ data: { user } })
})

// Sign out
auth.post('/signout', async (c) => {
  return c.json({ data: { success: true } })
})

export { auth as authRoute }
