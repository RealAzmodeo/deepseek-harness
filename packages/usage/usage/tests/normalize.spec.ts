import { describe, expect, it } from 'vitest'
import {
  DEFAULT_API_KEY_ENV, DEFAULT_BASE_URL, normalizeBalancePayload, resolveBaseUrl,
} from '../src/normalize.ts'

describe('resolveBaseUrl', () => {
  it('returns the DeepSeek default when no value is configured', () => {
    expect(resolveBaseUrl(undefined)).toBe(DEFAULT_BASE_URL)
  })

  it('strips a trailing slash from a configured base URL', () => {
    expect(resolveBaseUrl('https://proxy.example.com/')).toBe('https://proxy.example.com')
    expect(resolveBaseUrl('https://proxy.example.com///')).toBe('https://proxy.example.com')
  })

  it('rejects a value that is not a parseable URL', () => {
    expect(() => resolveBaseUrl('not a url')).toThrow(/baseUrl must be a valid URL/)
  })

  it('exposes the default API-key environment reference', () => {
    expect(DEFAULT_API_KEY_ENV).toBe('DEEPSEEK_API_KEY')
  })
})

describe('normalizeBalancePayload', () => {
  it('normalizes a complete payload into a frozen snapshot', () => {
    const snapshot = normalizeBalancePayload({
      is_available: true,
      balance_infos: [{
        currency: 'CNY',
        total_balance: '110.00',
        granted_balance: '10.00',
        topped_up_balance: '100.00',
      }],
    })
    expect(snapshot).toEqual({
      isAvailable: true,
      currencies: [{
        currency: 'CNY',
        totalBalance: '110.00',
        grantedBalance: '10.00',
        toppedUpBalance: '100.00',
      }],
    })
    expect(Object.isFrozen(snapshot)).toBe(true)
    expect(Object.isFrozen(snapshot.currencies)).toBe(true)
  })

  it('maps multiple currency rows in order', () => {
    const snapshot = normalizeBalancePayload({
      is_available: false,
      balance_infos: [
        { currency: 'CNY', total_balance: '1', granted_balance: '2', topped_up_balance: '3' },
        { currency: 'USD', total_balance: '4', granted_balance: '5', topped_up_balance: '6' },
      ],
    })
    expect(snapshot.isAvailable).toBe(false)
    expect(snapshot.currencies.map(entry => entry.currency)).toEqual(['CNY', 'USD'])
  })

  it('rejects a non-object payload', () => {
    expect(() => normalizeBalancePayload(null)).toThrow(/not an object/)
    expect(() => normalizeBalancePayload('nope')).toThrow(/not an object/)
    expect(() => normalizeBalancePayload(42)).toThrow(/not an object/)
  })

  it('rejects a missing or non-boolean is_available', () => {
    expect(() => normalizeBalancePayload({ balance_infos: [] })).toThrow(/is_available/)
    expect(() => normalizeBalancePayload({ is_available: 'yes', balance_infos: [] })).toThrow(/is_available/)
  })

  it('rejects a missing or non-array balance_infos', () => {
    expect(() => normalizeBalancePayload({ is_available: true })).toThrow(/balance_infos/)
    expect(() => normalizeBalancePayload({ is_available: true, balance_infos: 'x' })).toThrow(/balance_infos/)
  })

  it('rejects a non-object balance_infos entry', () => {
    expect(() => normalizeBalancePayload({ is_available: true, balance_infos: [null] })).toThrow(/entry is not an object/)
  })

  it.each(['currency', 'total_balance', 'granted_balance', 'topped_up_balance'])(
    'rejects an entry missing the string field %s', (field) => {
      const entry = {
        currency: 'CNY', total_balance: '1', granted_balance: '2', topped_up_balance: '3',
      }
      const withoutField = Object.fromEntries(
        Object.entries(entry).filter(([key]) => key !== field),
      )
      expect(() => normalizeBalancePayload({ is_available: true, balance_infos: [withoutField] }))
        .toThrow(new RegExp(field))
    },
  )

  it('rejects an entry whose string field has the wrong type', () => {
    expect(() => normalizeBalancePayload({
      is_available: true,
      balance_infos: [{ currency: 'CNY', total_balance: 1, granted_balance: '2', topped_up_balance: '3' }],
    })).toThrow(/total_balance/)
  })
})
