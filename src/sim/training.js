/**
 * Session resolution. Flat gains scaled by a fatigue multiplier, fatigue
 * applied, calendar advanced one day per session, history + milestones
 * recorded. Deterministic — no randomness, no Vue.
 */

import { VITALS } from '@/data/balance.js'
import { getSession } from '@/data/sessions.js'
import { MILESTONE_DEFS } from '@/data/milestones.js'
import { cloneState } from './state.js'
import { applyGains, maxDistanceKm } from './vitals.js'
import { gainMultiplier, addFatigue } from './fatigue.js'
import { aggregateModifiers, gainMultiplierFor } from './modifiers.js'
import { isSessionUnlocked, newMilestones } from './unlocks.js'

/**
 * Resolve a training session (or rest day).
 * @param {import('./state.js').GameState} state
 * @param {string} sessionId
 * @returns {{ state: import('./state.js').GameState, events: Array<object> }}
 */
export function resolveSession(state, sessionId) {
  const session = getSession(sessionId)
  if (!session) throw new Error(`Unknown session: ${sessionId}`)
  if (!isSessionUnlocked(state, sessionId)) throw new Error(`Session locked: ${sessionId}`)

  const next = cloneState(state)
  const events = []
  const mods = aggregateModifiers(state)

  // --- gains, scaled down by current fatigue ---------------------------------
  /** @type {Record<string, number>} */
  const deltas = {}
  if (!session.rest) {
    const mult = gainMultiplier(state.fatigue)
    /** @type {Record<string, number>} */
    const effective = {}
    for (const vital of VITALS) {
      const amount = session.gains[vital]
      if (!amount) continue
      effective[vital] = amount * gainMultiplierFor(mods, vital, session.id)
    }
    const before = state.vitals
    next.vitals = applyGains(next.vitals, effective, mult)
    for (const vital of VITALS) {
      const d = next.vitals[vital] - before[vital]
      if (d) deltas[vital] = Math.round(d * 100) / 100
    }
  }

  // --- fatigue ---------------------------------------------------------------
  let fatigueDelta = session.fatigue
  if (session.rest) fatigueDelta -= mods.restRecoveryBonus
  else if (session.id === 'recovery') fatigueDelta -= mods.recoveryRunBonus
  const fatigueMult = mods.fatigueMult[session.id]
  if (fatigueMult && fatigueDelta > 0) fatigueDelta *= fatigueMult
  next.fatigue = addFatigue(state.fatigue, fatigueDelta)

  // --- calendar + stats ------------------------------------------------------
  next.day = state.day + session.days
  next.stats = {
    sessionsByType: {
      ...next.stats.sessionsByType,
      [session.id]: (next.stats.sessionsByType[session.id] ?? 0) + 1,
    },
    sessionsCompleted: next.stats.sessionsCompleted + 1,
  }

  events.push({
    kind: 'session',
    day: next.day,
    sessionId: session.id,
    text: `${session.name} complete`,
    gains: deltas,
    fatigueDelta: Math.round((next.fatigue - state.fatigue) * 10) / 10,
  })

  next.vitalsHistory = [
    ...next.vitalsHistory,
    { day: next.day, vitals: { ...next.vitals }, maxDistance: maxDistanceKm(next.vitals) },
  ]

  // --- milestones ------------------------------------------------------------
  const gained = newMilestones(next)
  if (gained.length) {
    next.milestones = [...next.milestones, ...gained]
    for (const id of gained) {
      events.push({
        kind: 'milestone',
        day: next.day,
        milestoneId: id,
        text: MILESTONE_DEFS.find((m) => m.id === id)?.label ?? id,
      })
    }
  }

  next.recentEvents = [...events, ...next.recentEvents].slice(0, 30)
  return { state: next, events }
}
