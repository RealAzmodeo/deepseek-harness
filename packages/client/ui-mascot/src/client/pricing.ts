/**
 * Pure pricing-window and cost arithmetic for the cost mascot. No React and no
 * I/O live here: everything is a deterministic function of a `Date` and token
 * counters, so the time windows and cost math are unit-testable in isolation.
 * @module @deepseek-ai/dsh-client-ui-mascot/pricing
 */

/** A pricing window kind: full price versus the discounted band. */
export type PricingKind = 'peak' | 'off-peak'

/** A half-open UTC range `[start, end)` in minutes since midnight. */
export interface WindowRange {
  /** Inclusive start minute. */
  readonly start: number
  /** Exclusive end minute. */
  readonly end: number
}

/** The pricing rate active at one moment. */
export interface PricingWindow {
  readonly kind: PricingKind
  /** Cost multiplier: `1` for peak, {@link OFF_PEAK_MULTIPLIER} off-peak. */
  readonly multiplier: number
}

/** The next window transition and how far away it is. */
export interface NextBoundary {
  /** Wall-clock instant the transition occurs. */
  readonly at: Date
  /** Pricing kind that begins at {@link at}. */
  readonly kind: PricingKind
  /** Milliseconds from the queried instant until {@link at} (never negative). */
  readonly milliseconds: number
}

/** One per-token price set, in the display currency. */
export interface TokenPrices {
  /** Price per uncached input (and cache-write) token. */
  readonly inputPerToken: number
  /** Price per cache-read token. */
  readonly cacheReadPerToken: number
  /** Price per output token. */
  readonly outputPerToken: number
}

/** The token buckets the mascot reads off the session's `tokenUsage` projection. */
export interface TokenUsageLike {
  readonly uncachedInputTokens: number
  readonly outputTokens: number
  readonly cacheReadTokens?: number
  readonly cacheWriteTokens?: number
}

/** Full-price multiplier for a peak window. */
export const PEAK_MULTIPLIER = 1

/** Discount multiplier for an off-peak window (50% off). */
export const OFF_PEAK_MULTIPLIER = 0.5

/** DeepSeek peak windows in UTC minutes since midnight (01:00–04:00 and 06:00–10:00). */
export const PEAK_RANGES: readonly WindowRange[] = [
  { start: 60, end: 240 },
  { start: 360, end: 600 },
]

/** Transition minutes, ascending, with the kind that begins at each boundary. */
const BOUNDARIES: readonly { readonly minute: number; readonly after: PricingKind }[] = [
  { minute: 60, after: 'peak' },
  { minute: 240, after: 'off-peak' },
  { minute: 360, after: 'peak' },
  { minute: 600, after: 'off-peak' },
]

/** Default per-token prices (USD), aligned with DeepSeek chat pricing. */
export const DEFAULT_TOKEN_PRICES: TokenPrices = {
  inputPerToken: 0.27e-6,
  cacheReadPerToken: 0.07e-6,
  outputPerToken: 1.1e-6,
}

/**
 * UTC minute-of-day for an instant (0 through 1439).
 * @param date - the instant to project.
 * @returns `getUTCHours() * 60 + getUTCMinutes()`.
 */
export function utcMinuteOfDay(date: Date): number {
  return date.getUTCHours() * 60 + date.getUTCMinutes()
}

/**
 * Whether a UTC minute-of-day falls inside one of {@link PEAK_RANGES}.
 * @param minute - minute-of-day from {@link utcMinuteOfDay}.
 * @returns true only inside a peak range.
 */
export function isPeakMinute(minute: number): boolean {
  return PEAK_RANGES.some(range => minute >= range.start && minute < range.end)
}

/**
 * Pricing window for a UTC minute-of-day.
 * @param minute - minute-of-day from {@link utcMinuteOfDay}.
 * @returns the active window.
 */
export function windowAtMinute(minute: number): PricingWindow {
  return isPeakMinute(minute)
    ? { kind: 'peak', multiplier: PEAK_MULTIPLIER }
    : { kind: 'off-peak', multiplier: OFF_PEAK_MULTIPLIER }
}

/**
 * Pricing window active at an instant.
 * @param date - the instant to query.
 * @returns the active window.
 */
export function windowForDate(date: Date): PricingWindow {
  return windowAtMinute(utcMinuteOfDay(date))
}

/**
 * Next window transition at or after an instant. Transitions occur at the four
 * boundary minutes; after the last one of a day the next is the following day's
 * first boundary.
 * @param date - the instant to query.
 * @returns the next transition, its resulting kind, and the countdown to it.
 */
export function nextBoundary(date: Date): NextBoundary {
  const minute = utcMinuteOfDay(date)
  const dayStart = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  for (const boundary of BOUNDARIES) {
    if (boundary.minute > minute) {
      const at = new Date(dayStart + boundary.minute * 60_000)
      return { at, kind: boundary.after, milliseconds: at.getTime() - date.getTime() }
    }
  }

  const first = BOUNDARIES[0]
  if (!first) {
    throw new Error('BOUNDARIES must contain at least one element')
  }

  const at = new Date(dayStart + 24 * 60 * 60_000 + first.minute * 60_000)
  return { at, kind: first.after, milliseconds: at.getTime() - date.getTime() }
}
/**
 * Estimated cost of the token delta between two cumulative snapshots, priced at
 * one multiplier. Buckets are clamped so a never-decreasing projection cannot
 * read as a refund.
 * @param prev - the earlier cumulative snapshot.
 * @param next - the later cumulative snapshot.
 * @param prices - per-token prices.
 * @param multiplier - the active window's multiplier.
 * @returns the estimated cost of the delta, in the prices' currency.
 */
export function deltaCost(
  prev: TokenUsageLike,
  next: TokenUsageLike,
  prices: TokenPrices,
  multiplier: number,
): number {
  const inputDelta = Math.max(0, next.uncachedInputTokens - prev.uncachedInputTokens)
    + Math.max(0, (next.cacheWriteTokens ?? 0) - (prev.cacheWriteTokens ?? 0))
  const cacheReadDelta = Math.max(0, (next.cacheReadTokens ?? 0) - (prev.cacheReadTokens ?? 0))
  const outputDelta = Math.max(0, next.outputTokens - prev.outputTokens)
  return (inputDelta * prices.inputPerToken
    + cacheReadDelta * prices.cacheReadPerToken
    + outputDelta * prices.outputPerToken) * multiplier
}

/**
 * Human countdown for a millisecond span, e.g. `2h 03m 05s`.
 * @param milliseconds - remaining milliseconds.
 * @returns the formatted countdown (never negative).
 */
export function formatCountdown(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const pad = (value: number): string => String(value).padStart(2, '0')
  return `${hours}h ${pad(minutes)}m ${pad(seconds)}s`
}

/**
 * Estimated cost of a complete cumulative usage snapshot at one multiplier.
 * Uses the same bucket pricing as {@link deltaCost}: cache-write tokens price
 * at the input rate, cache-read tokens at the cache-read rate.
 * @param usage - a cumulative token snapshot.
 * @param prices - per-token prices.
 * @param multiplier - the active window's multiplier.
 * @returns the estimated cost, in the prices' currency.
 */
export function costOf(usage: TokenUsageLike, prices: TokenPrices, multiplier: number): number {
  const input = usage.uncachedInputTokens + (usage.cacheWriteTokens ?? 0)
  const cacheRead = usage.cacheReadTokens ?? 0
  return (input * prices.inputPerToken
    + cacheRead * prices.cacheReadPerToken
    + usage.outputTokens * prices.outputPerToken) * multiplier
}

/**
 * Format a cost with enough precision for per-token fractions.
 * @param value - the cost in the display currency.
 * @param currency - the display currency code.
 * @returns a human-readable cost string.
 */
export function formatCost(value: number, currency = 'USD'): string {
  const decimals = value >= 1 ? 4 : 6
  return `${currency} ${value.toFixed(decimals)}`
}

/** Balance health band, derived from the low threshold. */
export type BalanceLevel = 'low' | 'mid' | 'high'

/**
 * Classify a balance amount into a health band. Below the low threshold is
 * `low`; up to ten times it is `mid`; above that is `high`.
 * @param balance - the lowest total balance across currencies.
 * @param lowThreshold - the configured low-balance threshold.
 * @returns the health band.
 */
export function balanceLevel(balance: number, lowThreshold: number): BalanceLevel {
  if (balance <= lowThreshold) return 'low'
  if (balance <= lowThreshold * 10) return 'mid'
  return 'high'
}

/**
 * Browser local UTC offset (minutes ahead of UTC) at an instant.
 * @param date - the instant to query.
 * @returns `-getTimezoneOffset()`, so positive ahead of UTC.
 */
export function localOffsetMinutes(date: Date): number {
  return -date.getTimezoneOffset()
}

/**
 * Project a UTC minute-of-day onto the local clock minute under an offset.
 * @param utcMinute - minute-of-day in UTC (0..1439).
 * @param offsetMinutes - the local offset from {@link localOffsetMinutes}.
 * @returns the local clock minute, wrapped into [0, 1440).
 */
export function utcMinuteToLocal(utcMinute: number, offsetMinutes: number): number {
  return ((utcMinute + offsetMinutes) % 1440 + 1440) % 1440
}

/**
 * Format a minute-of-day as `HH:MM`, wrapping into [0, 1440).
 * @param minute - minute-of-day.
 * @returns the formatted clock time.
 */
export function formatMinutes(minute: number): string {
  const wrapped = ((Math.round(minute) % 1440) + 1440) % 1440
  const pad = (value: number): string => String(value).padStart(2, '0')
  return `${pad(Math.floor(wrapped / 60))}:${pad(wrapped % 60)}`
}

/**
 * Human label for the browser's current timezone.
 * @param utcLabel - already-localized label used when no timezone resolves.
 * @returns `IANA (abbreviation)`, e.g. `Europe/Madrid (CEST)`.
 */
export function timeZoneLabel(utcLabel: string): string {
  if (typeof Intl === 'undefined') return utcLabel
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
  if (timeZone === undefined || timeZone.length === 0) return utcLabel
  let abbreviation = timeZone
  try {
    const parts = new Intl.DateTimeFormat('en', { timeZoneName: 'short', timeZone }).formatToParts(new Date())
    const name = parts.find(part => part.type === 'timeZoneName')?.value
    if (name !== undefined && name.length > 0) abbreviation = name
  } catch {
    // A name the host cannot render falls back to the IANA id.
  }
  return `${timeZone} (${abbreviation})`
}

/**
 * Peak windows projected onto the local clock under an offset.
 * @param offsetMinutes - the local offset from {@link localOffsetMinutes}.
 * @returns a label like `03:00–06:00 & 08:00–12:00`.
 */
export function peakScheduleLocal(offsetMinutes: number): string {
  return PEAK_RANGES.map(range =>
    `${formatMinutes(utcMinuteToLocal(range.start, offsetMinutes))}–${formatMinutes(utcMinuteToLocal(range.end, offsetMinutes))}`,
  ).join(' & ')
}
