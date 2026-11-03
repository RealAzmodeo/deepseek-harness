import { afterEach, describe, expect, it, vi } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import UsageService, { fetchBalance } from '../src/index.ts'

const RAW_BALANCE = {
  is_available: true,
  balance_infos: [{
    currency: 'CNY', total_balance: '110.00', granted_balance: '10.00', topped_up_balance: '100.00',
  }],
}

/** Build a Host service wired to a stubbed credential resolver. */
function service(
  resolve: () => Promise<{ value: string; source: string } | undefined>,
): UsageService {
  const ctx = new Context()
  ctx.reflect.provide('credentials', { resolve })
  return new UsageService(ctx, { baseUrl: 'https://api.example.com', apiKeyEnv: 'TEST_KEY' })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('fetchBalance', () => {
  it('normalizes a successful response', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(RAW_BALANCE), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    await expect(fetchBalance('https://api.example.com', 'sk-test')).resolves.toEqual({
      isAvailable: true,
      currencies: [{
        currency: 'CNY', totalBalance: '110.00', grantedBalance: '10.00', toppedUpBalance: '100.00',
      }],
    })
    expect(fetchMock).toHaveBeenCalledWith('https://api.example.com/user/balance', expect.objectContaining({
      headers: expect.objectContaining({ authorization: 'Bearer sk-test' }),
    }))
  })

  it('surfaces the HTTP status for a non-OK response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 500 })))
    await expect(fetchBalance('https://api.example.com', 'sk-test')).rejects.toThrow('(HTTP 500)')
  })

  it('prefers a JSON error body detail over the status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ error: { message: 'insufficient balance' } }), { status: 402 },
    )))
    await expect(fetchBalance('https://api.example.com', 'sk-test')).rejects.toThrow('insufficient balance')
  })

  it('wraps a network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('connection refused')))
    await expect(fetchBalance('https://api.example.com', 'sk-test')).rejects.toThrow(/request failed/)
  })

  it('wraps an unprocessable response body', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{"is_available":true}', { status: 200 })))
    await expect(fetchBalance('https://api.example.com', 'sk-test')).rejects.toThrow(/unprocessable/)
  })
})

describe('UsageService.balance', () => {
  it('reports a stable failure when the credential is missing', async () => {
    const instance = service(async () => undefined)
    await expect(instance.balance()).resolves.toEqual({
      ok: false,
      error: { code: 'missing-credential', message: expect.stringContaining('TEST_KEY') },
    })
  })

  it('returns the normalized snapshot on success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(RAW_BALANCE), { status: 200 })))
    const instance = service(async () => ({ value: 'sk-test', source: 'env' }))
    await expect(instance.balance()).resolves.toEqual({
      ok: true,
      value: {
        isAvailable: true,
        currencies: [{
          currency: 'CNY', totalBalance: '110.00', grantedBalance: '10.00', toppedUpBalance: '100.00',
        }],
      },
    })
  })

  it('reports an upstream failure when the fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('boom')))
    const instance = service(async () => ({ value: 'sk-test', source: 'env' }))
    await expect(instance.balance()).resolves.toEqual({
      ok: false,
      error: { code: 'upstream', message: expect.stringContaining('boom') },
    })
  })
})
