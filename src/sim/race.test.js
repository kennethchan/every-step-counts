import { describe, it, expect } from 'vitest'
import { createInitialState } from './state.js'
import { simulateRace, isQualified, chooseAutoPacing } from './race.js'
import { resolveSession } from './training.js'
import { START_VITALS } from '@/data/balance.js'

/** Train a state up to a given fitness so we can race longer distances. */
function trained(vitals, seed = 42) {
  const state = createInitialState(seed)
  return { ...state, vitals: { ...START_VITALS, ...vitals } }
}

describe('race simulation', () => {
  it('is deterministic for a given seed', () => {
    const s = trained({ durability: 30 })
    const a = simulateRace(s, { distance: 5000, tier: 'local', pacing: 'even' })
    const b = simulateRace(s, { distance: 5000, tier: 'local', pacing: 'even' })
    expect(a.result.time).toBe(b.result.time)
    expect(a.result.place).toBe(b.result.place)
    expect(a.result.splits).toEqual(b.result.splits)
  })

  it('refuses a distance the runner cannot cover', () => {
    const s = createInitialState(1) // 2.0 km max
    expect(() => simulateRace(s, { distance: 10000, tier: 'local', pacing: 'even' })).toThrow(/cover/i)
  })

  it('allows the two distances a beginner can cover on day one', () => {
    const s = createInitialState(1)
    expect(simulateRace(s, { distance: 1000, tier: 'local', pacing: 'even' }).result.time).toBeGreaterThan(0)
    expect(simulateRace(s, { distance: 2000, tier: 'local', pacing: 'even' }).result.time).toBeGreaterThan(0)
  })

  it('a faster runner wins by a clear margin', () => {
    const slow = trained({ capacity: 20, threshold: 20, economy: 20, efficiency: 20, durability: 30 })
    const fast = trained({ capacity: 70, threshold: 70, economy: 70, efficiency: 70, durability: 30 })
    const slowRace = simulateRace(slow, { distance: 5000, tier: 'local', pacing: 'even' })
    const fastRace = simulateRace(fast, { distance: 5000, tier: 'local', pacing: 'even' })
    const margin = slowRace.result.time - fastRace.result.time
    expect(margin).toBeGreaterThan(120) // at least two minutes faster over 5k
    expect(fastRace.result.place).toBeLessThanOrEqual(slowRace.result.place)
  })

  it('gates tiers by qualification (absolute standards)', () => {
    const beginner = createInitialState(1)
    expect(isQualified(beginner, 'local')).toBe(true)
    expect(isQualified(beginner, 'club')).toBe(false)
    expect(() =>
      simulateRace(beginner, { distance: 1000, tier: 'club', pacing: 'even' }),
    ).toThrow(/qualif/i)
  })

  it('pays prize money and records a PB', () => {
    const s = createInitialState(7)
    const { state, result } = simulateRace(s, { distance: 1000, tier: 'local', pacing: 'even' })
    expect(state.money).toBeGreaterThan(0)
    expect(state.pbs['1000']).toBe(result.time)
    expect(result.isPb).toBe(true)
    expect(state.racesCompleted).toBe(1)
  })

  it('improves on a second, faster attempt and flags a PB', () => {
    const s0 = createInitialState(7)
    const first = simulateRace(s0, { distance: 1000, tier: 'local', pacing: 'even' })
    // Get fitter, then race again with the same seed.
    let s = first.state
    for (let i = 0; i < 20; i++) s = resolveSession(s, 'runwalk').state
    const second = simulateRace(s, { distance: 1000, tier: 'local', pacing: 'even' })
    expect(second.result.time).toBeLessThan(first.result.time)
    expect(second.result.isPb).toBe(true)
  })

  it('produces splits that sum to the total time', () => {
    const s = trained({ durability: 30 })
    const { result } = simulateRace(s, { distance: 10000, tier: 'local', pacing: 'even' })
    const sum = result.splits.reduce((a, b) => a + b, 0)
    expect(Math.abs(sum - result.time)).toBeLessThan(0.5)
  })

  it('auto pacing picks a strategy from the profile', () => {
    expect(['even', 'negative', 'positive']).toContain(chooseAutoPacing({ ...START_VITALS, durability: 60 }, 42195))
    expect(chooseAutoPacing({ ...START_VITALS, durability: 60 }, 42195)).toBe('negative')
  })

  it('fades over the distance, and durability reduces the fade', () => {
    /** Average last-split / first-split ratio across several seeds (luck cancels out). */
    function avgFade(durability) {
      let sum = 0
      let n = 0
      for (let seed = 1; seed <= 25; seed++) {
        const s = {
          ...createInitialState(seed),
          vitals: {
            ...START_VITALS,
            capacity: 50,
            threshold: 50,
            economy: 50,
            efficiency: 50,
            durability,
          },
        }
        const { lane } = simulateRace(s, { distance: 10000, tier: 'local', pacing: 'even' })
        sum += lane.splits[lane.splits.length - 1] / lane.splits[0]
        n++
      }
      return sum / n
    }

    const weak = avgFade(0)
    const strong = avgFade(100)
    expect(weak).toBeGreaterThan(1) // even pacing still fades from start to finish
    expect(weak).toBeGreaterThan(strong) // durability protects against that fade
  })
})
