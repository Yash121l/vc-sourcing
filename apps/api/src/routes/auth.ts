import { Hono } from 'hono'
import { WorkOS } from '@workos-inc/node'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import type { AppEnv } from '../env'

const auth = new Hono<AppEnv>()

function getWorkOS(env: AppEnv['Bindings']) {
  const key = env.WORKOS_API_KEY
  const clientId = env.WORKOS_CLIENT_ID
  if (!key || !clientId || key.startsWith('sk_test_REPLACE')) return null
  return { wos: new WorkOS(key), clientId }
}

auth.get('/url', (c) => {
  const ctx = getWorkOS(c.env)
  if (!ctx) {
    return c.json({ data: { url: null, dev_mode: true, message: 'Set WORKOS_API_KEY to enable auth.' } })
  }
  try {
    const result = ctx.wos.userManagement.getAuthorizationUrl({
      clientId: ctx.clientId,
      redirectUri: `${c.env.WEB_URL ?? 'http://localhost:5173'}/auth/callback`,
      provider: 'authkit',
    })
    // SDK may return string directly or { url } object
    const url = typeof result === 'string' ? result : (result as { url?: string }).url ?? String(result)
    return c.json({ data: { url } })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return c.json({ data: { url: null, error: msg } })
  }
})

auth.post('/callback', zValidator('json', z.object({ code: z.string() })), async (c) => {
  const ctx = getWorkOS(c.env)
  if (!ctx) {
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

auth.get('/me', (c) => {
  const user = c.get('user')
  if (!user) return c.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, 401)
  return c.json({ data: { user } })
})

auth.post('/signout', (c) => c.json({ data: { success: true } }))

export { auth as authRoute }
