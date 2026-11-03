/**
 * Session-cost breakdown: which agents contributed to a session's token cost.
 * The collector walks the retained session list from the current session down
 * through every subagent-origin child reachable in the snapshot, then prices
 * each agent's cumulative usage at one window multiplier so the per-agent costs
 * sum exactly to the reported total.
 * @module @deepseek-ai/dsh-client-ui-mascot/cost
 */

import { costOf } from './pricing.ts'
import type { TokenPrices, TokenUsageLike } from './pricing.ts'

/** Minimal shape of a retained session row the collector reads (no runtime dep). */
export interface CostSessionRow {
  readonly parentId?: string
  readonly origin?: string
  readonly displayTitle: string
  readonly projectionValues?: { readonly tokenUsage?: TokenUsageLike | undefined }
}

/** One agent's share of a session cost. */
export interface CostContribution {
  /** Session id of the agent. */
  readonly sessionId: string
  /** Human-facing label (durable title, project basename, then id). */
  readonly title: string
  /** True for a subagent-origin child session. */
  readonly isSubagent: boolean
  /** The agent's cumulative token usage, absent when the snapshot has none. */
  readonly usage: TokenUsageLike | undefined
  /** Estimated cost (0 when usage is absent). */
  readonly cost: number
  /** Fraction of the total in [0, 1]; 0 when the total is 0. */
  readonly share: number
}

/** Per-agent contributions plus their exact sum. */
export interface CostBreakdown {
  readonly rows: readonly CostContribution[]
  /** Sum of the rows' costs. */
  readonly total: number
}

/** Collect the current session and every subagent descendant reachable in the snapshot. */
export function collectSessionTree(
  byId: Readonly<Record<string, CostSessionRow | undefined>>,
  currentId: string,
): ReadonlyArray<Pick<CostContribution, 'sessionId' | 'title' | 'isSubagent' | 'usage'>> {
  const result: Array<Pick<CostContribution, 'sessionId' | 'title' | 'isSubagent' | 'usage'>> = []
  const visited = new Set<string>()
  const queue = [currentId]
  while (queue.length > 0) {
    const id = queue.shift()
    if (id === undefined || visited.has(id)) continue
    visited.add(id)
    const row = byId[id]
    if (row === undefined) continue
    result.push({
      sessionId: id,
      title: row.displayTitle,
      isSubagent: row.origin === 'subagent',
      usage: row.projectionValues?.tokenUsage,
    })
    for (const [childId, child] of Object.entries(byId)) {
      if (child !== undefined && child.origin === 'subagent' && child.parentId === id && !visited.has(childId)) {
        queue.push(childId)
      }
    }
  }
  return result
}

/**
 * Build the per-agent cost breakdown for one session tree, priced at one
 * multiplier so the rows sum exactly to the total.
 * @param byId - retained session rows keyed by id.
 * @param currentId - the session whose tree should be costed.
 * @param prices - per-token prices.
 * @param multiplier - the active window's multiplier.
 * @returns the breakdown.
 */
export function collectCostBreakdown(
  byId: Readonly<Record<string, CostSessionRow | undefined>>,
  currentId: string,
  prices: TokenPrices,
  multiplier: number,
): CostBreakdown {
  const tree = collectSessionTree(byId, currentId)
  const rows = tree.map(entry => ({
    ...entry,
    cost: entry.usage === undefined ? 0 : costOf(entry.usage, prices, multiplier),
  }))
  const total = rows.reduce((sum, row) => sum + row.cost, 0)
  const full = rows.map(row => ({ ...row, share: total === 0 ? 0 : row.cost / total }))
  return { rows: full, total }
}
