/**
 * The cost mascot widget: a floating bottom-right mascot that shows the active
 * DeepSeek pricing window, a countdown to the next change, the account balance,
 * and an estimate of the current session's token cost. States: off-peak saving
 * (green), peak caution (yellow), and low-balance danger (red). A gear opens a
 * settings panel to replace each state's image.
 * @module @deepseek-ai/dsh-client-ui-mascot/Mascot
 */

import { useCallback, useEffect, useState } from 'react'
import type { PropsLocale, PropsRuntime, TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import type { RemoteResult } from '@deepseek-ai/dsh-typert-protocol'
import type { BalanceResult, BalanceSnapshot } from '@deepseek-ai/dsh-usage/types'
// Type-only: merges the `tokenUsage` projection key into SessionProjectionMap.
import type {} from '@deepseek-ai/dsh-token-meter/client'
import { loadConfig, saveConfig } from './config.ts'
import type { MascotConfig, MascotImages, MascotImage } from './config.ts'
import { collectCostBreakdown } from './cost.ts'
import type { CostSessionRow } from './cost.ts'
import {
  balanceLevel, formatCost, formatCountdown, formatMinutes,
  localOffsetMinutes, nextBoundary, peakScheduleLocal,
  timeZoneLabel, windowForDate,
} from './pricing.ts'
import type { BalanceLevel, TokenUsageLike } from './pricing.ts'
import { NS, type MascotKey } from './locales.ts'
import css from './Mascot.module.css'

/** The three visual states the mascot can occupy. */
export type MascotState = 'off-peak' | 'peak' | 'danger'

/** Placeholder art per state, used until the user uploads an image. */
const EMOJI: Record<MascotState, string> = {
  'off-peak': '🐳',
  peak: '😅',
  danger: '🚨',
}

/** Dictionary key of the pricing-window label. */
const WINDOW_KEY = {
  'off-peak': 'window.offPeak',
  peak: 'window.peak',
} as const satisfies Record<'off-peak' | 'peak', MascotKey>

/** Dictionary key of the boundary kind a countdown runs toward. */
const KIND_KEY = {
  'off-peak': 'kind.offPeak',
  peak: 'kind.peak',
} as const satisfies Record<'off-peak' | 'peak', MascotKey>

/** Dictionary key of the balance-health label. */
const BALANCE_LEVEL_KEY = {
  low: 'level.low',
  mid: 'level.mid',
  high: 'level.high',
} as const satisfies Record<BalanceLevel, MascotKey>

/** Config image key each visual state maps to (only off-peak differs in case). */
const IMAGE_KEY: Record<MascotState, keyof MascotImages> = {
  'off-peak': 'offPeak',
  peak: 'peak',
  danger: 'danger',
}

/** Balance read status: still loading, not readable, or a ready snapshot. */
type BalanceStatus =
  | { readonly kind: 'loading' }
  | { readonly kind: 'unready'; readonly reason: 'missing-credential' | 'upstream' }
  | { readonly kind: 'ready'; readonly snapshot: BalanceSnapshot }

/** Lowest numeric total balance across every currency row, or undefined. */
function lowestBalance(snapshot: BalanceSnapshot): number | undefined {
  let lowest: number | undefined
  for (const entry of snapshot.currencies) {
    const value = Number(entry.totalBalance)
    if (!Number.isFinite(value)) continue
    if (lowest === undefined || value < lowest) lowest = value
  }
  return lowest
}

/** Compact token count, e.g. `12.3k`. */
function formatCount(value: number): string {
  return value >= 10000 ? `${(value / 1000).toFixed(1)}k` : String(value)
}

/** Short input/output token summary for one agent, or the no-data label. */
function formatTokens(usage: TokenUsageLike | undefined, t: TranslateNS<typeof NS>): string {
  if (usage === undefined) return t('tokens.none')
  const input = usage.uncachedInputTokens + (usage.cacheReadTokens ?? 0) + (usage.cacheWriteTokens ?? 0)
  return t('tokens.summary', { input: formatCount(input), output: formatCount(usage.outputTokens) })
}

/** Props the entry adapter supplies beyond the framework's standard kit. */
export type MascotProps = PropsRuntime<'shell.overlay'> & PropsLocale<typeof NS> & {
  /** Read the DeepSeek balance through the usage Remote (carrier-wrapped). */
  readonly balance: () => Promise<RemoteResult<BalanceResult>>
}

/** Read one file into a data URL, or undefined when no file was chosen. */
function readImage(file: File | undefined, onDone: (dataUrl: MascotImage) => void): void {
  if (file === undefined) return
  const reader = new FileReader()
  reader.addEventListener('load', () => { onDone(reader.result as string) })
  reader.addEventListener('error', () => { onDone(null) })
  reader.readAsDataURL(file)
}

/** One state's appearance row: a live preview, its label, and Change/Reset actions. */
function StateRow(props: {
  readonly label: string
  readonly emoji: string
  readonly image: MascotImage
  readonly onPick: (dataUrl: MascotImage) => void
  readonly t: TranslateNS<typeof NS>
}) {
  return (
    <div className={css.stateRow}>
      <span className={css.statePreview}>
        {props.image === null
          ? <span className={css.stateEmoji}>{props.emoji}</span>
          : <img className={css.stateArt} src={props.image} alt="" />}
      </span>
      <span className={css.stateLabel}>{props.label}</span>
      <label className={css.change}>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className={css.hiddenFile}
          onChange={(event) => { readImage(event.target.files?.[0], props.onPick) }}
        />
        {props.t('action.change')}
      </label>
      {props.image !== null && (
        <button
          type="button"
          className={css.stateReset}
          onClick={() => { props.onPick(null) }}
          title={props.t('action.resetToEmoji')}
        >
          {props.t('action.reset')}
        </button>
      )}
    </div>
  )
}

/**
 * The mascot widget and its speech bubble + settings panel.
 * @param props - the shell-overlay standard hook plus the balance Remote face.
 * @returns the floating widget, its bubble, and (when open) the settings panel.
 */
export function Mascot({ useSessions, balance, t }: MascotProps) {
  const [config, setConfig] = useState<MascotConfig>(loadConfig)
  const [now, setNow] = useState<number>(() => Date.now())
  const [balanceStatus, setBalanceStatus] = useState<BalanceStatus>({ kind: 'loading' })
  const [bubbleOpen, setBubbleOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [breakdownOpen, setBreakdownOpen] = useState(false)

  const current = useSessions(state => state.current)
  const byId = useSessions(state => state.byId)

  // One-second tick drives the countdown.
  useEffect(() => {
    const timer = setInterval(() => { setNow(Date.now()) }, 1000)
    return () => { clearInterval(timer) }
  }, [])

  const window = windowForDate(new Date(now))
  const boundary = nextBoundary(new Date(now))
  const breakdown = current === undefined
    ? undefined
    : collectCostBreakdown(
      byId as unknown as Readonly<Record<string, CostSessionRow | undefined>>,
      current, config.prices, window.multiplier,
    )
  const cost = breakdown?.total ?? 0

  const refreshBalance = useCallback(async () => {
    try {
      const carried = await balance()
      if (!carried.ok) {
        setBalanceStatus({ kind: 'unready', reason: 'upstream' })
        return
      }
      const result = carried.value
      setBalanceStatus(result.ok
        ? { kind: 'ready', snapshot: result.value }
        : { kind: 'unready', reason: result.error.code === 'missing-credential' ? 'missing-credential' : 'upstream' })
    } catch {
      setBalanceStatus({ kind: 'unready', reason: 'upstream' })
    }
  }, [balance])

  useEffect(() => {
    void refreshBalance()
    const timer = setInterval(() => { void refreshBalance() }, 60_000)
    return () => { clearInterval(timer) }
  }, [refreshBalance])

  const nowDate = new Date(now)
  const lowBalanceValue = balanceStatus.kind === 'ready' ? lowestBalance(balanceStatus.snapshot) : undefined
  const balanceBand = lowBalanceValue === undefined
    ? undefined
    : balanceLevel(lowBalanceValue, config.lowBalanceThreshold)
  const danger = balanceBand === 'low'
  const state: MascotState = danger ? 'danger' : window.kind === 'peak' ? 'peak' : 'off-peak'

  const image = config.images[IMAGE_KEY[state]]
  const mascotTitle = state === 'danger' ? t('state.lowBalance') : t(WINDOW_KEY[window.kind])
  const offset = localOffsetMinutes(nowDate)
  const localSchedule = peakScheduleLocal(offset)
  const tzLabel = timeZoneLabel(t('tz.utc'))
  const boundaryLocal = formatMinutes(boundary.at.getHours() * 60 + boundary.at.getMinutes())

  const updateImages = (patch: Partial<MascotImages>): void => {
    setConfig((previous) => {
      const next = { ...previous, images: { ...previous.images, ...patch } }
      saveConfig(next)
      return next
    })
  }

  return (
    <div className={css.root}>
      {bubbleOpen && (
        <div className={css.bubble}>
          <div className={css.hero}>
            <span className={css.balanceAmount}>{balanceText(balanceStatus, config.currency, t)}</span>
            {balanceBand !== undefined && (
              <span className={`${css.pill} ${css[balanceBand]}`}>{t(BALANCE_LEVEL_KEY[balanceBand])}</span>
            )}
          </div>
          <div className={css.rateBlock}>
            <div className={css.rateLabel}>{t(WINDOW_KEY[window.kind])}</div>
            <div className={css.rateEnds}>{t('rate.endsIn', {
              countdown: formatCountdown(boundary.milliseconds),
              boundary: boundaryLocal,
            })}</div>
          </div>
          <dl className={css.facts}>
            <div className={css.fact}><dt>{t('fact.sessionCost')}</dt><dd>{formatCost(cost, config.currency)}</dd></div>
            <div className={css.fact}><dt>{t('fact.peakLocal')}</dt><dd>{localSchedule}</dd></div>
            <div className={css.fact}><dt>{t('fact.timeZone')}</dt><dd>{tzLabel}</dd></div>
          </dl>
          {breakdown !== undefined && breakdown.rows.length > 1 && (
            <div className={css.costSection}>
              <button
                type="button"
                className={css.costToggle}
                onClick={() => { setBreakdownOpen(open => !open) }}
              >
                <span className={css.costChevron}>{breakdownOpen ? '▾' : '▸'}</span>
                {t('cost.breakdown', { count: breakdown.rows.length })}
              </button>
              {breakdownOpen && (
                <div className={css.costRows}>
                  {breakdown.rows.map(row => (
                    <div className={css.costRow} key={row.sessionId}>
                      <span className={css.costRowLabel}>
                        {row.isSubagent && <span className={css.costSubagent}>↳</span>}
                        <span className={css.costRowTitle} title={row.title}>{row.title}</span>
                      </span>
                      <span className={css.costRowTokens}>{formatTokens(row.usage, t)}</span>
                      <span className={css.costRowCost}>{formatCost(row.cost, config.currency)}</span>
                    </div>
                  ))}
                  <span className={css.costNote}>{t('cost.note')}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      <div className={css.controls}>
        <button
          type="button"
          className={`${css.mascot} ${css[state]}`}
          onClick={() => {
            setSettingsOpen(false)
            setBubbleOpen(open => !open)
          }}
          aria-label={mascotTitle}
          title={t('mascot.title', {
            title: mascotTitle,
            countdown: formatCountdown(boundary.milliseconds),
            kind: t(KIND_KEY[boundary.kind]),
          })}
        >
          {image === null
            ? <span className={css.emoji}>{EMOJI[state]}</span>
            : <img className={css.art} src={image} alt={mascotTitle} />}
        </button>
        <button
          type="button"
          className={css.gear}
          onClick={() => {
            setBubbleOpen(false)
            setSettingsOpen(open => !open)
          }}
          aria-label={t('settings.open')}
        >
          ⚙
        </button>
      </div>
      {settingsOpen && (
        <div className={css.panel}>
          <div className={css.panelHeader}>
            <span className={css.panelTitle}>{t('settings.open')}</span>
            <button
              type="button"
              className={css.panelClose}
              onClick={() => { setSettingsOpen(false) }}
              aria-label={t('settings.close')}
            >
              ✕
            </button>
          </div>

          <span className={css.sectionLabel}>{t('settings.appearance')}</span>
          <div className={css.states}>
            <StateRow t={t} label={t('settings.state.offPeak')} emoji={EMOJI['off-peak']} image={config.images.offPeak} onPick={(dataUrl) => { updateImages({ offPeak: dataUrl }) }} />
            <StateRow t={t} label={t('settings.state.peak')} emoji={EMOJI.peak} image={config.images.peak} onPick={(dataUrl) => { updateImages({ peak: dataUrl }) }} />
            <StateRow t={t} label={t('settings.state.danger')} emoji={EMOJI.danger} image={config.images.danger} onPick={(dataUrl) => { updateImages({ danger: dataUrl }) }} />
          </div>

          <span className={css.sectionLabel}>{t('settings.balance')}</span>
          <label className={css.field}>
            <span className={css.fieldLabel}>{t('settings.threshold')}</span>
            <input
              type="number"
              value={config.lowBalanceThreshold}
              onChange={(event) => {
                const value = Number(event.target.value)
                setConfig((previous) => {
                  const next = { ...previous, lowBalanceThreshold: Number.isFinite(value) ? value : previous.lowBalanceThreshold }
                  saveConfig(next)
                  return next
                })
              }}
            />
          </label>
          <span className={css.fieldHint}>{t('settings.thresholdHint')}</span>

          <div className={css.panelFooter}>
            <button
              type="button"
              className={css.reset}
              onClick={() => { updateImages({ offPeak: null, peak: null, danger: null }) }}
            >
              {t('action.resetAllToEmoji')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/** Render the balance cell text for its status. */
function balanceText(status: BalanceStatus, currency: string, t: TranslateNS<typeof NS>): string {
  if (status.kind === 'loading') return '…'
  if (status.kind === 'unready') {
    return status.reason === 'missing-credential' ? t('balance.missingKey') : t('balance.readFailed')
  }
  const lowest = lowestBalance(status.snapshot)
  if (lowest === undefined) return status.snapshot.isAvailable ? '—' : t('balance.readFailed')
  const currencyCode = status.snapshot.currencies[0]?.currency ?? currency
  return `${lowest.toFixed(2)} ${currencyCode}`
}

export default Mascot

// Re-export the entry-level types for the plugin body and tests.
export type { MascotImage, MascotImages, MascotConfig } from './config.ts'
