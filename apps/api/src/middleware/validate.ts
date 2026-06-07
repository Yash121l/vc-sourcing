import type { Context, Next } from 'hono'
import { HTTPException } from 'hono/http-exception'

export function requestLogger() {
  return async (c: Context, next: Next) => {
    const start = Date.now()
    await next()
    const ms = Date.now() - start
    if (ms > 2000) {
      console.warn(`Slow request: ${c.req.method} ${c.req.url} — ${ms}ms`)
    }
  }
}

export function errorHandler() {
  return async (c: Context, next: Next) => {
    try {
      await next()
    } catch (err) {
      if (err instanceof HTTPException) {
        return c.json({ error: { code: 'HTTP_ERROR', message: err.message } }, err.status)
      }
      const message = err instanceof Error ? err.message : 'Internal server error'
      console.error('Unhandled error:', err)
      return c.json({ error: { code: 'INTERNAL_ERROR', message } }, 500)
    }
  }
}

export function rateLimiter(opts: { windowMs?: number; max?: number } = {}) {
  const { windowMs = 60_000, max = 100 } = opts
  const counts = new Map<string, { count: number; reset: number }>()

  return async (c: Context, next: Next) => {
    const key = c.req.header('x-forwarded-for') ?? c.req.header('x-real-ip') ?? 'unknown'
    const now = Date.now()
    const record = counts.get(key)

    if (!record || record.reset < now) {
      counts.set(key, { count: 1, reset: now + windowMs })
    } else {
      record.count++
      if (record.count > max) {
        return c.json({ error: { code: 'RATE_LIMITED', message: 'Too many requests' } }, 429)
      }
    }
    return next()
  }
}

export function paginate(c: Context) {
  const page = Math.max(1, parseInt(c.req.query('page') ?? '1'))
  const per_page = Math.min(100, Math.max(1, parseInt(c.req.query('per_page') ?? '20')))
  return { page, per_page, offset: (page - 1) * per_page }
}
