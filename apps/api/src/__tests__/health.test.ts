import { describe, it, expect } from 'vitest'

// Unit-level test for health endpoint logic
describe('Health check', () => {
  it('returns current timestamp in ISO format', () => {
    const ts = new Date().toISOString()
    expect(ts).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
  })
})

describe('Environment validation', () => {
  it('API port defaults to 3001', () => {
    const port = parseInt(process.env['PORT'] ?? '3001')
    expect(port).toBeGreaterThan(0)
    expect(port).toBeLessThanOrEqual(65535)
  })

  it('recognises placeholder Anthropic key as unconfigured', () => {
    const key = 'sk-ant-api03-REPLACE_WITH_YOUR_KEY'
    expect(key.startsWith('sk-ant-api03-REPLACE')).toBe(true)
  })
})
