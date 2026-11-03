import { describe, expect, it } from 'vitest'
import { collectCostBreakdown, collectSessionTree } from '../src/client/cost.ts'
import type { CostSessionRow } from '../src/client/cost.ts'
import { DEFAULT_TOKEN_PRICES } from '../src/client/pricing.ts'

const usage = { uncachedInputTokens: 100, outputTokens: 20, cacheReadTokens: 40, cacheWriteTokens: 50 }

function session(row: Partial<CostSessionRow> & { displayTitle: string }): CostSessionRow {
  return row as CostSessionRow
}

describe('collectSessionTree', () => {
  it('collects the current session alone when it has no subagents', () => {
    const tree = collectSessionTree({ main: session({ displayTitle: 'Main' }) }, 'main')
    expect(tree).toEqual([
      { sessionId: 'main', title: 'Main', isSubagent: false, usage: undefined },
    ])
  })

  it('walks direct and nested subagent children depth-first', () => {
    const byId = {
      main: session({ displayTitle: 'Main', projectionValues: { tokenUsage: usage } }),
      worker: session({ displayTitle: 'worker-1', parentId: 'main', origin: 'subagent', projectionValues: { tokenUsage: usage } }),
      scout: session({ displayTitle: 'scout', parentId: 'worker', origin: 'subagent', projectionValues: { tokenUsage: usage } }),
    }
    // Non-subagent child of main (a fork) must NOT propagate.
    const tree = collectSessionTree({ ...byId, fork: session({ displayTitle: 'fork', parentId: 'main' }) }, 'main')
    expect(tree.map(entry => entry.sessionId)).toEqual(['main', 'worker', 'scout'])
    expect(tree[1]).toMatchObject({ isSubagent: true, title: 'worker-1' })
    expect(tree[2]).toMatchObject({ isSubagent: true, title: 'scout' })
  })

  it('terminates on a parent cycle', () => {
    const byId = {
      a: session({ displayTitle: 'a', origin: 'subagent', parentId: 'b' }),
      b: session({ displayTitle: 'b', origin: 'subagent', parentId: 'a' }),
    }
    expect(collectSessionTree(byId, 'a').length).toBe(2)
  })

  it('skips a missing current session', () => {
    expect(collectSessionTree({}, 'ghost')).toEqual([])
  })
})

describe('collectCostBreakdown', () => {
  it('prices a single session and totals it', () => {
    const byId = { main: session({ displayTitle: 'Main', projectionValues: { tokenUsage: usage } }) }
    const result = collectCostBreakdown(byId, 'main', DEFAULT_TOKEN_PRICES, 1)
    expect(result.rows).toHaveLength(1)
    expect(result.total).toBe(result.rows[0]!.cost)
    expect(result.rows[0]!.share).toBe(1)
  })

  it('sums the main agent and every subagent exactly', () => {
    const byId = {
      main: session({ displayTitle: 'Main', projectionValues: { tokenUsage: usage } }),
      worker: session({ displayTitle: 'worker-1', parentId: 'main', origin: 'subagent', projectionValues: { tokenUsage: usage } }),
    }
    const result = collectCostBreakdown(byId, 'main', DEFAULT_TOKEN_PRICES, 1)
    expect(result.rows).toHaveLength(2)
    expect(result.total).toBeCloseTo(result.rows[0]!.cost + result.rows[1]!.cost, 12)
    expect(result.rows[1]!.isSubagent).toBe(true)
  })

  it('counts an agent with no token usage as zero cost', () => {
    const byId = {
      main: session({ displayTitle: 'Main', projectionValues: { tokenUsage: usage } }),
      worker: session({ displayTitle: 'worker-1', parentId: 'main', origin: 'subagent' }),
    }
    const result = collectCostBreakdown(byId, 'main', DEFAULT_TOKEN_PRICES, 1)
    expect(result.rows[1]!.cost).toBe(0)
    expect(result.rows[1]!.usage).toBeUndefined()
  })

  it('applies the window multiplier to every row', () => {
    const byId = { main: session({ displayTitle: 'Main', projectionValues: { tokenUsage: usage } }) }
    const full = collectCostBreakdown(byId, 'main', DEFAULT_TOKEN_PRICES, 1)
    const half = collectCostBreakdown(byId, 'main', DEFAULT_TOKEN_PRICES, 0.5)
    expect(half.total).toBeCloseTo(full.total * 0.5, 12)
  })

  it('normalizes shares to sum to one', () => {
    const byId = {
      main: session({ displayTitle: 'Main', projectionValues: { tokenUsage: usage } }),
      worker: session({ displayTitle: 'worker-1', parentId: 'main', origin: 'subagent', projectionValues: { tokenUsage: { ...usage, uncachedInputTokens: 300 } } }),
    }
    const result = collectCostBreakdown(byId, 'main', DEFAULT_TOKEN_PRICES, 1)
    const shareSum = result.rows.reduce((sum, row) => sum + row.share, 0)
    expect(shareSum).toBeCloseTo(1, 12)
  })
})
