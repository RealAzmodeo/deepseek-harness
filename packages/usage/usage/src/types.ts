/**
 * Client-safe request/result vocabulary for the DeepSeek account-balance
 * Remote. Types only, so the generated Remote client can consume this module
 * without importing Host runtime code.
 * @module @deepseek-ai/dsh-usage/types
 */

/** One currency's balance row from DeepSeek's `/user/balance` response. */
export interface BalanceCurrency {
  /** ISO currency code, e.g. `CNY`. */
  readonly currency: string
  /** Total remaining balance for this currency, as a decimal string. */
  readonly totalBalance: string
  /** Granted (free-tier) balance, as a decimal string. */
  readonly grantedBalance: string
  /** Topped-up (paid) balance, as a decimal string. */
  readonly toppedUpBalance: string
}

/** Normalized account-balance snapshot. */
export interface BalanceSnapshot {
  /** Whether the account can currently issue API requests. */
  readonly isAvailable: boolean
  /** Balance rows reported by the API, one per currency. */
  readonly currencies: readonly BalanceCurrency[]
}

/** Successful balance read. */
export interface BalanceSuccess {
  readonly ok: true
  readonly value: BalanceSnapshot
}

/** Stable business failure for a balance read. */
export interface BalanceFailure {
  readonly ok: false
  readonly error: BalanceError
}

/** Failure vocabulary shared by every balance read. */
export interface BalanceError {
  readonly code: 'missing-credential' | 'upstream'
  readonly message: string
}

/** Result returned by the usage `balance` operation. */
export type BalanceResult = BalanceSuccess | BalanceFailure
