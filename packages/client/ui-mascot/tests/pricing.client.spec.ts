import { describe, expect, it } from 'vitest'
import {
  balanceLevel, costOf, DEFAULT_TOKEN_PRICES, deltaCost, formatCost, formatCountdown,
  formatMinutes, isPeakMinute, localOffsetMinutes, nextBoundary, OFF_PEAK_MULTIPLIER,
  peakScheduleLocal, PEAK_MULTIPLIER, PEAK_RANGES, timeZoneLabel, utcMinuteOfDay,
  utcMinuteToLocal, windowAtMinute, windowForDate,
} from '../src/client/pricing.ts'
import type { TokenUsageLike } from '../src/client/pricing.ts'

const usage = (overrides: Partial<TokenUsageLike> = {}): TokenUsageLike => ({
  uncachedInputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0, ...overrides,
})

describe('pricing constants', () => {
  it('exposes the two peak UTC windows from the spec', () => {
    expect(PEAK_RANGES).toEqual([
      { start: 60, end: 240 },
      { start: 360, end: 600 },
    ])
  })

  it('exposes full and half-price multipliers and default token prices', () => {
    expect(PEAK_MULTIPLIER).toBe(1)
    expect(OFF_PEAK_MULTIPLIER).toBe(0.5)
    expect(DEFAULT_TOKEN_PRICES.outputPerToken).toBeGreaterThan(DEFAULT_TOKEN_PRICES.inputPerToken)
    expect(DEFAULT_TOKEN_PRICES.inputPerToken).toBeGreaterThan(DEFAULT_TOKEN_PRICES.cacheReadPerToken)
  })
})

describe('utcMinuteOfDay', () => {
  it('projects hours and minutes into minute-of-day', () => {
    expect(utcMinuteOfDay(new Date(Date.UTC(2024, 0, 1, 0, 0)))).toBe(0)
    expect(utcMinuteOfDay(new Date(Date.UTC(2024, 0, 1, 1, 0)))).toBe(60)
    expect(utcMinuteOfDay(new Date(Date.UTC(2024, 0, 1, 23, 59)))).toBe(1439)
  })
})

describe('window detection', () => {
  it.each([
    [0, 'off-peak'], [59, 'off-peak'], [60, 'peak'], [239, 'peak'],
    [240, 'off-peak'], [359, 'off-peak'], [360, 'peak'], [599, 'peak'], [600, 'off-peak'],
  ])('classifies minute %i as %s', (minute, kind) => {
    expect(isPeakMinute(minute)).toBe(kind === 'peak')
    expect(windowAtMinute(minute)).toEqual({
      kind,
      multiplier: kind === 'peak' ? PEAK_MULTIPLIER : OFF_PEAK_MULTIPLIER,
    })
  })

  it('derives the window from a Date', () => {
    expect(windowForDate(new Date(Date.UTC(2024, 0, 1, 2, 0)))).toEqual({ kind: 'peak', multiplier: 1 })
    expect(windowForDate(new Date(Date.UTC(2024, 0, 1, 5, 0)))).toEqual({ kind: 'off-peak', multiplier: 0.5 })
  })
})

describe('nextBoundary', () => {
  it('returns the next in-day transition with a countdown', () => {
    const result = nextBoundary(new Date(Date.UTC(2024, 0, 1, 0, 30)))
    expect(result.kind).toBe('peak')
    expect(result.at.toISOString()).toBe('2024-01-01T01:00:00.000Z')
    expect(result.milliseconds).toBe(30 * 60_000)
  })

  it('moves from a peak window to the off-peak end', () => {
    const result = nextBoundary(new Date(Date.UTC(2024, 0, 1, 3, 0)))
    expect(result.kind).toBe('off-peak')
    expect(result.at.toISOString()).toBe('2024-01-01T04:00:00.000Z')
  })

  it('moves from the inter-window gap into the second peak', () => {
    const result = nextBoundary(new Date(Date.UTC(2024, 0, 1, 5, 0)))
    expect(result.kind).toBe('peak')
    expect(result.at.toISOString()).toBe('2024-01-01T06:00:00.000Z')
  })

  it('wraps to the next day after the final boundary', () => {
    const result = nextBoundary(new Date(Date.UTC(2024, 0, 1, 12, 0)))
    expect(result.kind).toBe('peak')
    expect(result.at.toISOString()).toBe('2024-01-02T01:00:00.000Z')
    expect(result.milliseconds).toBe(13 * 60 * 60_000)
  })
})

describe('deltaCost', () => {
  it('returns zero when nothing changed', () => {
    expect(deltaCost(usage(), usage(), DEFAULT_TOKEN_PRICES, 1)).toBe(0)
  })

  it('prices uncached input and cache-write at the input rate', () => {
    const prev = usage()
    const next = usage({ uncachedInputTokens: 100, cacheWriteTokens: 50 })
    expect(deltaCost(prev, next, DEFAULT_TOKEN_PRICES, 1))
      .toBe(150 * DEFAULT_TOKEN_PRICES.inputPerToken)
  })

  it('prices cache reads and output at their own rates', () => {
    const prev = usage()
    const next = usage({ cacheReadTokens: 40, outputTokens: 20 })
    expect(deltaCost(prev, next, DEFAULT_TOKEN_PRICES, 1))
      .toBe(40 * DEFAULT_TOKEN_PRICES.cacheReadPerToken + 20 * DEFAULT_TOKEN_PRICES.outputPerToken)
  })

  it('applies the window multiplier', () => {
    const prev = usage()
    const next = usage({ outputTokens: 100 })
    expect(deltaCost(prev, next, DEFAULT_TOKEN_PRICES, 0.5))
      .toBe(100 * DEFAULT_TOKEN_PRICES.outputPerToken * 0.5)
  })

  it('clamps a regressed bucket to zero', () => {
    const prev = usage({ uncachedInputTokens: 500 })
    const next = usage({ uncachedInputTokens: 400 })
    expect(deltaCost(prev, next, DEFAULT_TOKEN_PRICES, 1)).toBe(0)
  })
})

describe('costOf', () => {
  it('prices the full cumulative snapshot with the same buckets as deltaCost', () => {
    const snapshot = usage({ uncachedInputTokens: 100, cacheWriteTokens: 50, cacheReadTokens: 40, outputTokens: 20 })
    const expected = (150 * DEFAULT_TOKEN_PRICES.inputPerToken
      + 40 * DEFAULT_TOKEN_PRICES.cacheReadPerToken
      + 20 * DEFAULT_TOKEN_PRICES.outputPerToken) * 0.5
    expect(costOf(snapshot, DEFAULT_TOKEN_PRICES, 0.5)).toBeCloseTo(expected, 12)
  })

  it('returns zero for an empty snapshot', () => {
    expect(costOf(usage(), DEFAULT_TOKEN_PRICES, 1)).toBe(0)
  })

  it('applies the multiplier', () => {
    expect(costOf(usage({ outputTokens: 100 }), DEFAULT_TOKEN_PRICES, 1))
      .toBe(100 * DEFAULT_TOKEN_PRICES.outputPerToken)
    expect(costOf(usage({ outputTokens: 100 }), DEFAULT_TOKEN_PRICES, 0.5))
      .toBe(100 * DEFAULT_TOKEN_PRICES.outputPerToken * 0.5)
  })
})

describe('formatCountdown', () => {
  it('formats hours, minutes, and seconds', () => {
    expect(formatCountdown(0)).toBe('0h 00m 00s')
    expect(formatCountdown(1000)).toBe('0h 00m 01s')
    expect(formatCountdown(90_000)).toBe('0h 01m 30s')
    expect(formatCountdown(3_660_000)).toBe('1h 01m 00s')
  })

  it('never renders a negative countdown', () => {
    expect(formatCountdown(-5000)).toBe('0h 00m 00s')
  })
})

describe('formatCost', () => {
  it('uses six decimals below one unit and four at or above', () => {
    expect(formatCost(0)).toBe('USD 0.000000')
    expect(formatCost(0.000001)).toBe('USD 0.000001')
    expect(formatCost(1.5)).toBe('USD 1.5000')
  })

  it('honors the currency code', () => {
    expect(formatCost(2, 'CNY')).toBe('CNY 2.0000')
  })
})

describe('balanceLevel', () => {
  it('classifies by multiples of the low threshold', () => {
    expect(balanceLevel(5, 5)).toBe('low')
    expect(balanceLevel(3.79, 5)).toBe('low')
    expect(balanceLevel(50, 5)).toBe('mid')
    expect(balanceLevel(51, 5)).toBe('high')
  })
})

describe('local time projection', () => {
  it('projects a UTC minute onto the local clock under a positive offset', () => {
    expect(utcMinuteToLocal(60, 120)).toBe(180)
    expect(utcMinuteToLocal(360, 120)).toBe(480)
  })

  it('wraps a negative local minute back into the day', () => {
    expect(utcMinuteToLocal(300, -480)).toBe(1260)
  })

  it('wraps a local minute past midnight', () => {
    expect(utcMinuteToLocal(1380, 120)).toBe(60)
  })

  it('reads the browser offset from a Date', () => {
    const date = new Date(Date.UTC(2024, 0, 1))
    expect(localOffsetMinutes(date)).toBe(-date.getTimezoneOffset())
  })

  it('reports a non-empty timezone label', () => {
    expect(timeZoneLabel('UTC').length).toBeGreaterThan(0)
  })
})

describe('formatMinutes', () => {
  it('formats clock times and wraps out-of-day values', () => {
    expect(formatMinutes(0)).toBe('00:00')
    expect(formatMinutes(60)).toBe('01:00')
    expect(formatMinutes(1439)).toBe('23:59')
    expect(formatMinutes(1440)).toBe('00:00')
    expect(formatMinutes(-60)).toBe('23:00')
  })
})

describe('peakScheduleLocal', () => {
  it('renders the peak ranges in UTC under a zero offset', () => {
    expect(peakScheduleLocal(0)).toBe('01:00–04:00 & 06:00–10:00')
  })

  it('shifts the schedule into local time under a positive offset', () => {
    expect(peakScheduleLocal(120)).toBe('03:00–06:00 & 08:00–12:00')
  })
})
