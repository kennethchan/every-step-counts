/**
 * The single entry point for mutating game state.
 *
 * `resolve(state, action)` is a pure reducer: it returns a NEW state plus a list
 * of events. The UI never mutates state directly — it dispatches actions here.
 * This is what makes offline/race determinism, replay and testing possible.
 */

import { getGear } from '@/data/gear.js'
import { cloneState } from './state.js'
import { resolveSession } from './training.js'
import { simulateRace, isQualified } from './race.js'
import { canCover } from './vitals.js'
import { unlockMet, isSessionUnlocked } from './unlocks.js'
import { getLocation } from '@/data/locations.js'

/**
 * @typedef {object} Action
 * @property {string} type
 * @property {any} [payload]
 */

/**
 * @param {import('./state.js').GameState} state
 * @param {Action} action
 * @returns {{ state: import('./state.js').GameState, events: Array<object> }}
 */
export function resolve(state, action) {
  switch (action.type) {
    case 'START_SESSION':
      return startSession(state, action.payload.sessionId)
    case 'CANCEL_SESSION':
      return cancelSession(state)
    case 'RESOLVE_SESSION':
      return resolveActiveSession(state)
    case 'REST':
      return resolveSession(state, 'rest')
    case 'BUY_GEAR':
      return buyGear(state, action.payload.gearId)
    case 'RUN_RACE':
      return runRace(state, action.payload)
    case 'SET_LOCATION':
      return setLocation(state, action.payload.locationId)
    case 'SET_SETTINGS':
      return setSettings(state, action.payload)
    default:
      throw new Error(`Unknown action: ${action.type}`)
  }
}

/**
 * Mark a session as in progress (locks the UI while the animation plays).
 * @param {import('./state.js').GameState} state
 * @param {string} sessionId
 */
function startSession(state, sessionId) {
  if (!isSessionUnlocked(state, sessionId)) throw new Error(`Session locked: ${sessionId}`)
  const next = cloneState(state)
  next.activeSession = { sessionId }
  return { state: next, events: [] }
}

/** @param {import('./state.js').GameState} state */
function cancelSession(state) {
  const next = cloneState(state)
  next.activeSession = null
  return { state: next, events: [] }
}

/** @param {import('./state.js').GameState} state */
function resolveActiveSession(state) {
  if (!state.activeSession) throw new Error('No active session')
  const sessionId = state.activeSession.sessionId
  const result = resolveSession(state, sessionId)
  const next = cloneState(result.state)
  next.activeSession = null
  return { state: next, events: result.events }
}

/**
 * Purchase gear (permanent; milestone-gated availability).
 * @param {import('./state.js').GameState} state
 * @param {string} gearId
 */
function buyGear(state, gearId) {
  const gear = getGear(gearId)
  if (!gear) throw new Error(`Unknown gear: ${gearId}`)
  if (state.ownedGear.includes(gearId)) throw new Error('Already owned')
  if (!unlockMet(state, gear.unlock)) throw new Error('Not yet available')
  if (state.money < gear.price) throw new Error('Not enough money')

  const next = cloneState(state)
  next.money = state.money - gear.price
  next.ownedGear = [...state.ownedGear, gearId]
  const events = [{ kind: 'gear', day: state.day, text: `Bought ${gear.name}`, gearId }]
  next.recentEvents = [...events, ...next.recentEvents].slice(0, 30)
  return { state: next, events }
}

/**
 * Enter and immediately simulate a race.
 * @param {import('./state.js').GameState} state
 * @param {{ distance: number, tier: string, pacing: string }} payload
 */
function runRace(state, payload) {
  const { state: next, events, result, lane } = simulateRace(state, payload)
  return { state: next, events, result, lane }
}

/**
 * Change the displayed location (must be unlocked).
 * @param {import('./state.js').GameState} state
 * @param {string} locationId
 */
function setLocation(state, locationId) {
  const loc = getLocation(locationId)
  if (!loc) throw new Error(`Unknown location: ${locationId}`)
  if (!unlockMet(state, loc.unlock)) throw new Error('Location locked')
  const next = cloneState(state)
  next.location = locationId
  return { state: next, events: [] }
}

/**
 * Patch settings.
 * @param {import('./state.js').GameState} state
 * @param {Partial<{ fastMode: boolean, autoFastMode: boolean }>} patch
 */
function setSettings(state, patch) {
  const next = cloneState(state)
  next.settings = { ...next.settings, ...patch }
  return { state: next, events: [] }
}

/** Re-exported for the UI so it can pre-check race eligibility. */
export { isQualified, canCover }
