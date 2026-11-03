import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_CONFIG, loadConfig, saveConfig } from '../src/client/config.ts'

/** Minimal in-memory localStorage double. */
function memoryStorage(): Storage {
  const store = new Map<string, string>()
  return {
    get length() { return store.size },
    clear: () => { store.clear() },
    getItem: key => store.get(key) ?? null,
    key: index => [...store.keys()][index] ?? null,
    removeItem: (key) => { store.delete(key) },
    setItem: (key, value) => { store.set(key, value) },
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('loadConfig', () => {
  it('returns the defaults when localStorage is absent', () => {
    expect(loadConfig()).toEqual(DEFAULT_CONFIG)
  })

  it('reads a fully-persisted config', () => {
    const persisted = {
      images: { offPeak: 'data:off', peak: 'data:peak', danger: 'data:danger' },
      lowBalanceThreshold: 3,
      currency: 'CNY',
      prices: { inputPerToken: 1, cacheReadPerToken: 2, outputPerToken: 3 },
    }
    vi.stubGlobal('localStorage', Object.assign(memoryStorage(), {
      getItem: () => JSON.stringify(persisted),
    }))
    expect(loadConfig()).toEqual(persisted)
  })

  it('falls back to defaults on a corrupt entry', () => {
    vi.stubGlobal('localStorage', Object.assign(memoryStorage(), {
      getItem: () => '{not json',
    }))
    expect(loadConfig()).toEqual(DEFAULT_CONFIG)
  })

  it('merges partial fields over the defaults', () => {
    vi.stubGlobal('localStorage', Object.assign(memoryStorage(), {
      getItem: () => JSON.stringify({ currency: 'CNY' }),
    }))
    expect(loadConfig()).toEqual({ ...DEFAULT_CONFIG, currency: 'CNY' })
  })
})

describe('saveConfig', () => {
  it('persists the config as JSON', () => {
    const setItem = vi.fn()
    vi.stubGlobal('localStorage', Object.assign(memoryStorage(), { setItem }))
    saveConfig(DEFAULT_CONFIG)
    expect(setItem).toHaveBeenCalledWith('dsh.mascot.config', JSON.stringify(DEFAULT_CONFIG))
  })

  it('is a no-op when localStorage is absent', () => {
    expect(() => saveConfig(DEFAULT_CONFIG)).not.toThrow()
  })
})
