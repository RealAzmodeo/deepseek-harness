/**
 * DeepSeek account-balance Remote. The browser never holds the DeepSeek API
 * key: this Host service resolves it from the credentials seam, calls
 * `GET {baseUrl}/user/balance`, and returns only the normalized, non-secret
 * balance snapshot across the Remote wire.
 * @module @deepseek-ai/dsh-usage
 */

import { Context } from '@deepseek-ai/cordis'
import s from '@deepseek-ai/schemastery'
import { credentialRef } from '@deepseek-ai/dsh-credentials'
import type { CredentialRef } from '@deepseek-ai/dsh-credentials'
import { TypertRemoteService, Remote } from '@deepseek-ai/dsh-typert-protocol'
import {
  DEFAULT_API_KEY_ENV, DEFAULT_BASE_URL, normalizeBalancePayload, resolveBaseUrl,
} from './normalize.ts'
import type { BalanceResult, BalanceSnapshot } from './types.ts'

export {
  DEFAULT_API_KEY_ENV, DEFAULT_BASE_URL, normalizeBalancePayload, resolveBaseUrl,
} from './normalize.ts'
export type * from './types.ts'

/** Deployment-varying balance-proxy policy. */
export interface Config {
  /** DeepSeek API base URL; `/user/balance` is appended. */
  readonly baseUrl?: string
  /** Credential reference holding the DeepSeek API key. */
  readonly apiKeyEnv?: string
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    usage: UsageService
  }
}

/** Endpoint path appended to the configured base URL. */
const BALANCE_PATH = '/user/balance'

/** Hard cap on one balance read, so a stalled upstream cannot hold a Remote call open. */
const BALANCE_TIMEOUT_MS = 10_000

/**
 * Fetch and normalize one balance snapshot from the DeepSeek API.
 * @param baseUrl - resolved base URL without a trailing slash.
 * @param apiKey - resolved DeepSeek API key.
 * @returns the normalized snapshot.
 * @throws Error when the request fails or the response is unprocessable.
 */
export async function fetchBalance(baseUrl: string, apiKey: string): Promise<BalanceSnapshot> {
  let response: Response
  try {
    response = await fetch(`${baseUrl}${BALANCE_PATH}`, {
      headers: {
        authorization: `Bearer ${apiKey}`,
        accept: 'application/json',
      },
      redirect: 'error',
      signal: AbortSignal.timeout(BALANCE_TIMEOUT_MS),
    })
  } catch (error) {
    throw new Error(`DeepSeek balance request failed: ${String(error)}`, { cause: error })
  }

  if (!response.ok) {
    let detail = `DeepSeek API error (HTTP ${response.status})`
    try {
      const parsed = await response.json() as { error?: { message?: string } | string }
      const message = typeof parsed.error === 'string' ? parsed.error : parsed.error?.message
      if (message !== undefined && message.length > 0) detail = message
    } catch {
      // A non-JSON error body only costs a richer message, never the HTTP status.
    }
    throw new Error(detail)
  }

  try {
    const payload: unknown = await response.json()
    return normalizeBalancePayload(payload)
  } catch (error) {
    throw new Error(`DeepSeek balance response was unprocessable: ${String(error)}`, { cause: error })
  }
}

/**
 * Stateless Remote service (`ctx.usage`) that proxies the account-balance
 * endpoint. The Remote method is the only client-visible face; the fetch and
 * normalization are ordinary Host internals.
 */
export class UsageService extends TypertRemoteService {
  static inject = ['credentials']

  static Config: s<Config> = s.object({
    baseUrl: s.string().default(DEFAULT_BASE_URL),
    apiKeyEnv: s.string().default(DEFAULT_API_KEY_ENV),
  })

  private readonly baseUrl: string
  private readonly apiKeyEnv: CredentialRef

  /**
   * @param ctx - Host context carrying the credentials service.
   * @param config - optional base-URL and API-key reference overrides.
   */
  constructor(ctx: Context, config: Config = {}) {
    super(ctx, 'usage')
    this.baseUrl = resolveBaseUrl(config.baseUrl)
    this.apiKeyEnv = credentialRef(config.apiKeyEnv ?? DEFAULT_API_KEY_ENV)
  }

  /**
   * Read the current DeepSeek account balance.
   * @returns the normalized snapshot, or a stable failure when the key is
   *   missing or the upstream request fails.
   */
  @Remote('balance')
  async balance(): Promise<BalanceResult> {
    const resolved = await this.ctx.credentials.resolve(this.apiKeyEnv)
    if (resolved === undefined) {
      return {
        ok: false,
        error: {
          code: 'missing-credential',
          message: `no DeepSeek API key for "${this.apiKeyEnv}"; store it through the credentials service or export it in the launching environment`,
        },
      }
    }
    try {
      const value = await fetchBalance(this.baseUrl, resolved.value)
      return { ok: true, value }
    } catch (error) {
      return { ok: false, error: { code: 'upstream', message: String(error) } }
    }
  }
}

export default UsageService
