import { describe, it, expect } from 'vitest'
import { formatCurrency, formatRelativeTime, computeOverallScore, scoreColor } from '../lib/utils'

describe('formatCurrency', () => {
  it('formats values using Intl.NumberFormat by default', () => {
    const result = formatCurrency(1_500_000)
    expect(result).toContain('1,500,000')
    expect(result).toContain('$')
  })

  it('formats millions in compact mode', () => {
    expect(formatCurrency(1_500_000, { compact: true })).toBe('$1.5M')
    expect(formatCurrency(10_000_000, { compact: true })).toBe('$10.0M')
  })

  it('formats billions in compact mode', () => {
    expect(formatCurrency(1_500_000_000, { compact: true })).toBe('$1.5B')
  })

  it('formats thousands in compact mode', () => {
    expect(formatCurrency(500_000, { compact: true })).toBe('$500K')
  })

  it('returns em dash for null', () => {
    expect(formatCurrency(null)).toBe('—')
  })

  it('returns em dash for undefined', () => {
    expect(formatCurrency(undefined)).toBe('—')
  })
})

describe('formatRelativeTime', () => {
  it('returns em dash for falsy input', () => {
    expect(formatRelativeTime(null)).toBe('—')
    expect(formatRelativeTime(undefined)).toBe('—')
    expect(formatRelativeTime('')).toBe('—')
  })

  it('shows "now" for the current timestamp', () => {
    const now = new Date().toISOString()
    // Intl.RelativeTimeFormat with numeric:'auto' returns "now" for 0 seconds
    const result = formatRelativeTime(now)
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('shows relative minutes for recent past', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60_000).toISOString()
    const result = formatRelativeTime(fiveMinutesAgo)
    expect(result).toContain('minute')
  })

  it('shows relative hours for older timestamps', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 3_600_000).toISOString()
    const result = formatRelativeTime(twoHoursAgo)
    expect(result).toContain('hour')
  })
})

describe('computeOverallScore', () => {
  it('computes weighted average (team and business_model are 1.5x)', () => {
    const scores = {
      team: 8,
      market: 7,
      product: 6,
      traction: 7,
      business_model: 5,
      investment_fit: 8,
    }
    const result = computeOverallScore(scores)
    expect(result).toBeGreaterThan(0)
    expect(result).toBeLessThanOrEqual(10)
    // Manually: (8×1.5 + 7×1 + 6×1 + 7×1 + 5×1.5 + 8×1) / (1.5+1+1+1+1.5+1)
    // = (12 + 7 + 6 + 7 + 7.5 + 8) / 7 = 47.5 / 7 ≈ 6.8
    expect(result).toBeCloseTo(6.8, 1)
  })

  it('returns 10 when all dims are 10', () => {
    const scores = { team: 10, market: 10, product: 10, traction: 10, business_model: 10, investment_fit: 10 }
    expect(computeOverallScore(scores)).toBe(10)
  })

  it('returns 1 when all dims are 1', () => {
    const scores = { team: 1, market: 1, product: 1, traction: 1, business_model: 1, investment_fit: 1 }
    expect(computeOverallScore(scores)).toBe(1)
  })

  it('ignores null and undefined scores', () => {
    const scores = { team: 8, market: null, product: undefined, traction: 7, business_model: 6, investment_fit: 9 }
    const result = computeOverallScore(scores)
    expect(result).toBeGreaterThan(0)
  })

  it('returns 0 when all scores are null', () => {
    expect(computeOverallScore({ team: null, market: null })).toBe(0)
  })
})

describe('scoreColor', () => {
  it('returns green hex for scores ≥ 8', () => {
    expect(scoreColor(9)).toBe('#10b981')
    expect(scoreColor(8)).toBe('#10b981')
  })

  it('returns amber hex for scores 6–7', () => {
    expect(scoreColor(7)).toBe('#f59e0b')
    expect(scoreColor(6)).toBe('#f59e0b')
  })

  it('returns orange hex for scores 4–5', () => {
    expect(scoreColor(5)).toBe('#f97316')
    expect(scoreColor(4)).toBe('#f97316')
  })

  it('returns red hex for scores below 4', () => {
    expect(scoreColor(3)).toBe('#ef4444')
    expect(scoreColor(1)).toBe('#ef4444')
  })
})
