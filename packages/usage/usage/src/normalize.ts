/**
 * Pure validation and normalization for the DeepSeek account-balance proxy.
 * No I/O lives here: these functions turn a wire payload into the typed
 * {@link BalanceSnapshot} and validate the deployment-varying base URL.
 * @module @deepseek-ai/dsh-usage/normalize
 */

import type { BalanceCurrency, BalanceSnapshot } from './types.ts'

/** Default DeepSeek API base URL; `/user/balance` is appended at call time. */
export const DEFAULT_BASE_URL = 'https://api.deepseek.com'

/** Default credential reference holding the DeepSeek API key. */
export const DEFAULT_API_KEY_ENV = 'DEEPSEEK_API_KEY'

/**
 * Resolve and validate the balance-proxy base URL. A trailing slash is
 * stripped so the endpoint path joins without a double slash.
 * @param value - configured base URL, or undefined for the default.
 * @returns the normalized base URL without a trailing slash.
 * @throws TypeError when the value is not a parseable URL.
 */
export function resolveBaseUrl(value: string | undefined): string {
  const candidate = value ?? DEFAULT_BASE_URL
  if (!URL.canParse(candidate)) {
    throw new TypeError(`usage: baseUrl must be a valid URL, got ${JSON.stringify(candidate)}`)
  }
  return candidate.replace(/\/+$/, '')
}

/**
 * Validate a DeepSeek `/user/balance` payload and map it to the typed
 * {@link BalanceSnapshot}. Every field is checked at this wire boundary.
 * @param payload - the parsed response body, of unknown shape.
 * @returns a frozen, normalized snapshot.
 * @throws TypeError when a required field is missing or has the wrong type.
 */
export function normalizeBalancePayload(payload: unknown): BalanceSnapshot {
  if (typeof payload !== 'object' || payload === null) {
    throw new TypeError('DeepSeek balance response is not an object')
  }
  const record = payload as Record<string, unknown>
  if (typeof record.is_available !== 'boolean') {
    throw new TypeError('DeepSeek balance response is missing boolean is_available')
  }
  if (!Array.isArray(record.balance_infos)) {
    throw new TypeError('DeepSeek balance response is missing balance_infos array')
  }
  const currencies = record.balance_infos.map(normalizeCurrency)
  return Object.freeze({ isAvailable: record.is_available, currencies: Object.freeze(currencies) })
}

/** Validate one `balance_infos` entry into a frozen {@link BalanceCurrency}. */
function normalizeCurrency(entry: unknown): BalanceCurrency {
  if (typeof entry !== 'object' || entry === null) {
    throw new TypeError('DeepSeek balance_infos entry is not an object')
  }
  const record = entry as Record<string, unknown>
  return Object.freeze({
    currency: requiredString(record.currency, 'currency'),
    totalBalance: requiredString(record.total_balance, 'total_balance'),
    grantedBalance: requiredString(record.granted_balance, 'granted_balance'),
    toppedUpBalance: requiredString(record.topped_up_balance, 'topped_up_balance'),
  })
}

/** Require a string field, throwing a message naming the missing field. */
function requiredString(value: unknown, field: string): string {
  if (typeof value !== 'string') {
    throw new TypeError(`DeepSeek balance_infos entry is missing string ${field}`)
  }
  return value
}
