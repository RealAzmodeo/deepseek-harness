/**
 * User-owned mascot configuration: custom mascot images per state, the low
 * balance threshold, and the display currency. Stored in `localStorage` so the
 * widget stays a pure client plugin — no Host settings namespace is required.
 * @module @deepseek-ai/dsh-client-ui-mascot/config
 */

import type { TokenPrices } from './pricing.ts'
import { DEFAULT_TOKEN_PRICES } from './pricing.ts'

/** Custom image (data URL) for one mascot state, or null to use the emoji. */
export type MascotImage = string | null

/** Custom images keyed by the three visual states. */
export interface MascotImages {
  /** Off-peak saving state (green). */
  readonly offPeak: MascotImage
  /** Peak caution state (yellow). */
  readonly peak: MascotImage
  /** Low-balance danger state (red). */
  readonly danger: MascotImage
}

/** The complete user-editable mascot configuration. */
export interface MascotConfig {
  readonly images: MascotImages
  /** Balance (in display currency) at or below which the danger state wins. */
  readonly lowBalanceThreshold: number
  /** Display currency code, e.g. `USD` or `CNY`. */
  readonly currency: string
  readonly prices: TokenPrices
}

/** localStorage key for the mascot configuration. */
export const CONFIG_KEY = 'dsh.mascot.config'

/** The config used before the user edits anything. */
export const DEFAULT_CONFIG: MascotConfig = {
  images: { offPeak: null, peak: null, danger: null },
  lowBalanceThreshold: 5,
  currency: 'USD',
  prices: DEFAULT_TOKEN_PRICES,
}

/**
 * Read the persisted config, falling back field-by-field to
 * {@link DEFAULT_CONFIG} so a partially-corrupt entry never breaks the widget.
 * @returns the merged config.
 */
export function loadConfig(): MascotConfig {
  if (typeof localStorage === 'undefined') return DEFAULT_CONFIG
  try {
    const raw = localStorage.getItem(CONFIG_KEY)
    if (raw === null) return DEFAULT_CONFIG
    const parsed = JSON.parse(raw) as Partial<MascotConfig>
    return {
      images: {
        offPeak: typeof parsed.images?.offPeak === 'string' ? parsed.images.offPeak : null,
        peak: typeof parsed.images?.peak === 'string' ? parsed.images.peak : null,
        danger: typeof parsed.images?.danger === 'string' ? parsed.images.danger : null,
      },
      lowBalanceThreshold: typeof parsed.lowBalanceThreshold === 'number'
        ? parsed.lowBalanceThreshold
        : DEFAULT_CONFIG.lowBalanceThreshold,
      currency: typeof parsed.currency === 'string' ? parsed.currency : DEFAULT_CONFIG.currency,
      prices: {
        inputPerToken: typeof parsed.prices?.inputPerToken === 'number'
          ? parsed.prices.inputPerToken
          : DEFAULT_TOKEN_PRICES.inputPerToken,
        cacheReadPerToken: typeof parsed.prices?.cacheReadPerToken === 'number'
          ? parsed.prices.cacheReadPerToken
          : DEFAULT_TOKEN_PRICES.cacheReadPerToken,
        outputPerToken: typeof parsed.prices?.outputPerToken === 'number'
          ? parsed.prices.outputPerToken
          : DEFAULT_TOKEN_PRICES.outputPerToken,
      },
    }
  } catch {
    return DEFAULT_CONFIG
  }
}

/**
 * Persist the config. Storage failures (quota, private mode) are swallowed so a
 * full storage never breaks the widget.
 * @param config - the config to store.
 */
export function saveConfig(config: MascotConfig): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config))
  } catch {
    // Storage failures only skip persistence.
  }
}
