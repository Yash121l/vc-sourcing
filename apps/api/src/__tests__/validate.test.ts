import { describe, it, expect, vi } from 'vitest'
import { rateLimiter, paginate } from '../middleware/validate'

describe('rateLimiter', () => {
  it('allows requests under the limit', async () => {
    const limiter = rateLimiter({ max: 5, windowMs: 60_000 })
    let blocked = false
    const next = vi.fn().mockResolvedValue(undefined)
    const makeRequest = async () => {
      const c = {
        req: { header: () => '127.0.0.1' },
        json: (body: unknown, status?: number) => {
          if (status === 429) blocked = true
          return body
        },
      } as never
      await limiter(c, next)
    }
    for (let i = 0; i < 5; i++) await makeRequest()
    expect(blocked).toBe(false)
    expect(next).toHaveBeenCalledTimes(5)
  })

  it('blocks requests over the limit', async () => {
    const limiter = rateLimiter({ max: 2, windowMs: 60_000 })
    let blocked = false
    const next = vi.fn().mockResolvedValue(undefined)
    const c = {
      req: { header: () => '10.0.0.1' },
      json: (_body: unknown, status?: number) => {
        if (status === 429) blocked = true
      },
    } as never
    await limiter(c, next)
    await limiter(c, next)
    await limiter(c, next) // 3rd request — should be blocked
    expect(blocked).toBe(true)
    expect(next).toHaveBeenCalledTimes(2)
  })
})

describe('paginate', () => {
  it('parses page and per_page from query', () => {
    const c = { req: { query: (k: string) => (k === 'page' ? '2' : '10') } } as never
    const result = paginate(c)
    expect(result).toEqual({ page: 2, per_page: 10, offset: 10 })
  })

  it('defaults to page 1 and per_page 20', () => {
    const c = { req: { query: () => undefined } } as never
    const result = paginate(c)
    expect(result).toEqual({ page: 1, per_page: 20, offset: 0 })
  })

  it('clamps per_page to 100', () => {
    const c = { req: { query: (k: string) => (k === 'per_page' ? '999' : '1') } } as never
    const result = paginate(c)
    expect(result.per_page).toBe(100)
  })
})
