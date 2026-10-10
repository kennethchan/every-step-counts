import { describe, it, expect } from 'vitest'
import { createInitialState } from './state.js'
import { resolve } from './actions.js'
import { unlockedSessions, maxDistanceKm } from './index.js'

/**
 * Balance harness — NOT a strict unit test. It plays the game with a simple
 * policy and reports how the journey actually paces out, so the numbers in
 * `data/balance.js` can be tuned against the "Standard: ~180 sessions" target.
 *
 * Run with: npm run balance
 */

const THRESHOLDS = [1, 2, 3, 5, 10, 21.097, 42.195]

/** Rest when tired, otherwise rotate across unlocked sessions so vitals spread. */
function makePolicy() {
  let i = 0
  return function policy(state) {
    if (state.fatigue > 60) return 'rest'
    const available = unlockedSessions(state)
      .filter((s) => !s.rest && s.id !== 'recovery')
      .map((s) => s.id)
    if (available.length === 0) return 'easy'
    const choice = available[i % available.length]
    i++
    return choice
  }
}

/** @param {number} maxSessions */
function playGame(maxSessions = 400) {
  let state = createInitialState(12345)
  const policy = makePolicy()
  /** @type {Record<string, number>} */
  const unlockedAt = {}
  const sessionLog = []

  for (let n = 0; n < maxSessions; n++) {
    const id = policy(state)
    state = resolve(state, { type: 'START_SESSION', payload: { sessionId: id } }).state
    state = resolve(state, { type: 'RESOLVE_SESSION' }).state
    sessionLog.push(id)

    const km = maxDistanceKm(state.vitals)
    for (const t of THRESHOLDS) {
      const key = String(t)
      if (unlockedAt[key] === undefined && km >= t) unlockedAt[key] = n + 1
    }
    if (km >= 42.195) {
      return { state, sessions: n + 1, unlockedAt, sessionLog }
    }
  }

  return { state, sessions: maxSessions, unlockedAt, sessionLog }
}

describe('balance harness', () => {
  it('reaches marathon distance within a sane number of sessions', () => {
    const { state, sessions, unlockedAt } = playGame()

    // Diagnostic output — read this when tuning balance.js.
    // eslint-disable-next-line no-console
    console.log('\n=== JOURNEY PACING (unoptimised policy) ===')
    for (const km of THRESHOLDS) {
      const at = unlockedAt[String(km)]
      // eslint-disable-next-line no-console
      console.log(`  ${String(km).padStart(6)} km  ->  session ${at ?? '(not reached)'}`)
    }
    // eslint-disable-next-line no-console
    console.log(`  marathon reachable after ~${sessions} sessions`)
    // eslint-disable-next-line no-console
    console.log('  final vitals:', state.vitals, '\n')

    expect(unlockedAt['42.195']).toBeDefined()
    expect(sessions).toBeLessThan(400)
    expect(sessions).toBeGreaterThan(20)
  })
})
