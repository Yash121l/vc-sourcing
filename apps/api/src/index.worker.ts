/**
 * Cloudflare Workers entrypoint for the Hono API.
 *
 * Env bindings (set via wrangler.toml + `wrangler secret put`):
 *   ANTHROPIC_API_KEY, WORKOS_API_KEY, WORKOS_CLIENT_ID,
 *   DATABASE_URL, DATABASE_AUTH_TOKEN, WEB_URL, REQUIRE_AUTH
 *
 * The Workers runtime injects these via the `env` object below.
 * We map them onto process.env shims so the rest of the codebase
 * (which uses process.env) works without changes.
 */

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createClient } from '@libsql/client/http'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from '@vc/db/schema'

type Env = {
  ANTHROPIC_API_KEY: string
  WORKOS_API_KEY: string
  WORKOS_CLIENT_ID: string
  DATABASE_URL: string
  DATABASE_AUTH_TOKEN: string
  WEB_URL: string
  REQUIRE_AUTH: string
}

const app = new Hono<{ Bindings: Env }>()

app.use('*', async (c, next) => {
  // Shim env into process.env for shared middleware
  Object.assign(process.env, {
    ANTHROPIC_API_KEY: c.env.ANTHROPIC_API_KEY,
    WORKOS_API_KEY: c.env.WORKOS_API_KEY,
    WORKOS_CLIENT_ID: c.env.WORKOS_CLIENT_ID,
    DATABASE_URL: c.env.DATABASE_URL,
    DATABASE_AUTH_TOKEN: c.env.DATABASE_AUTH_TOKEN,
    WEB_URL: c.env.WEB_URL,
    REQUIRE_AUTH: c.env.REQUIRE_AUTH,
  })
  return next()
})

app.use(
  '*',
  cors({
    origin: (origin, c) => c.env.WEB_URL ?? 'https://vc-sourcing.pages.dev',
    credentials: true,
  }),
)

app.get('/health', (c) => c.json({ status: 'ok', runtime: 'cloudflare-workers' }))

// Mount routes dynamically using the same Hono routes from index.ts
// In production, run: wrangler deploy --compatibility-flags nodejs_compat
export default {
  fetch: app.fetch,
}
