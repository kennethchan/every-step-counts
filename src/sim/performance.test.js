import { describe, it, expect } from 'vitest'
import { predictTime, referenceTime, riegelExponent, racePace } from './performance.js'
import { START_VITALS } from '@/data/balance.js'

/** Build a vitals object from overrides on top of the beginner baseline. */
function vitals(overrides = {}) {
  return { ...START_VITALS, ...overrides }
}

describe('performance model', () => {
  it('produces a finite, positive reference time', () => {
    const t = referenceTime(vitals())
    expect(Number.isFinite(t)).toBe(true)
    expect(t).toBeGreaterThan(0)
  })

  it('predicts slower times at longer distances', () => {
    const v = vitals({ capacity: 50, threshold: 50, economy: 50, efficiency: 50, durability: 50 })
    const t5 = predictTime(v, 5000)
    const t10 = predictTime(v, 10000)
    const tHalf = predictTime(v, 21097)
    const tFull = predictTime(v, 42195)
    expect(t10).toBeGreaterThan(t5)
    expect(tHalf).toBeGreaterThan(t10)
    expect(tFull).toBeGreaterThan(tHalf)
  })

  it('a fitter runner is faster at every distance', () => {
    const slow = vitals()
    const fast = vitals({ capacity: 80, threshold: 80, economy: 80, efficiency: 80, durability: 60 })
    expect(racePace(fast)).toBeGreaterThan(racePace(slow))
    expect(predictTime(fast, 5000)).toBeLessThan(predictTime(slow, 5000))
    expect(predictTime(fast, 42195)).toBeLessThan(predictTime(slow, 42195))
  })

  it('durability lowers the Riegel exponent (better at distance)', () => {
    expect(riegelExponent(100)).toBeLessThan(riegelExponent(0))
  })

  it('shows the elite end landing in a plausible 5k range', () => {
    const elite = vitals({ capacity: 100, threshold: 100, economy: 100, efficiency: 100, durability: 70 })
    const t5 = predictTime(elite, 5000)
    // Near-elite but not superhuman: between ~13 and ~16 minutes.
    expect(t5).toBeGreaterThan(13 * 60)
    expect(t5).toBeLessThan(16 * 60)
  })

  it('a beginner cannot run a fast 5k', () => {
    const t5 = predictTime(vitals(), 5000)
    expect(t5).toBeGreaterThan(30 * 60)
  })
})
