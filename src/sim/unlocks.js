/**
 * Unlock evaluation. Everything here is DERIVED from state — nothing is stored
 * except the accumulated `milestones` list, so unlocks can be re-tuned without
 * breaking existing saves.
 *
 * Two gates:
 *   - sessions unlock by VITALS thresholds (ties the tech tree to your fitness)
 *   - gear appears at a MILESTONE, then is purchased with money
 */

import { SESSIONS } from '@/data/sessions.js'
import { GEAR } from '@/data/gear.js'
import { LOCATIONS } from '@/data/locations.js'
import { maxDistanceKm } from './vitals.js'
import { aggregateModifiers } from './modifiers.js'

/**
 * @typedef {object} UnlockSpec
 * @property {number} [capacity]
 * @property {number} [efficiency]
 * @property {number} [threshold]
 * @property {number} [economy]
 * @property {number} [speed]
 * @property {number} [durability]
 * @property {string} [flag]
 * @property {number} [maxDistance]
 * @property {{ distance?: number, tier?: string }} [race]
 * @property {string} [milestone]
 */

/**
 * Does the state satisfy an unlock spec? (all conditions required)
 * @param {import('./state.js').GameState} state
 * @param {UnlockSpec|null|undefined} unlock
 * @returns {boolean}
 */
export function unlockMet(state, unlock) {
  if (!unlock) return true
  const flags = aggregateModifiers(state).flags

  const vitalKeys = ['capacity', 'efficiency', 'threshold', 'economy', 'speed', 'durability']
  for (const key of vitalKeys) {
    const need = unlock[/** @type {keyof UnlockSpec} */ (key)]
    if (typeof need === 'number' && state.vitals[/** @type {any} */ (key)] < need) return false
  }

  if (unlock.flag && !flags.has(unlock.flag)) return false

  if (typeof unlock.maxDistance === 'number' && maxDistanceKm(state.vitals) < unlock.maxDistance) return false

  if (unlock.race) {
    const ok = state.raceResults.some(
      (r) =>
        (unlock.race?.distance === undefined || r.distance >= unlock.race.distance) &&
        (unlock.race?.tier === undefined || r.tier === unlock.race.tier),
    )
    if (!ok) return false
  }

  if (unlock.milestone && !state.milestones.includes(unlock.milestone)) return false

  return true
}

/**
 * Sessions currently available to train.
 * @param {import('./state.js').GameState} state
 * @returns {Array<import('./state.js').SessionDef & { rest?: boolean }>}
 */
export function unlockedSessions(state) {
  return SESSIONS.filter((s) => unlockMet(state, s.unlock))
}

/**
 * True when a specific session is available.
 * @param {import('./state.js').GameState} state
 * @param {string} sessionId
 * @returns {boolean}
 */
export function isSessionUnlocked(state, sessionId) {
  const s = SESSIONS.find((x) => x.id === sessionId)
  return !!s && unlockMet(state, s.unlock)
}

/**
 * Gear that has appeared in the shop (unlock met) and is not yet owned.
 * @param {import('./state.js').GameState} state
 * @returns {Array<{ def: (typeof GEAR)[number], affordable: boolean }>}
 */
export function availableGear(state) {
  return GEAR.filter((g) => !state.ownedGear.includes(g.id) && unlockMet(state, g.unlock)).map((def) => ({
    def,
    affordable: state.money >= def.price,
  }))
}

/**
 * Gear not yet visible because its milestone hasn't been reached.
 * @param {import('./state.js').GameState} state
 * @returns {Array<(typeof GEAR)[number]>}
 */
export function hiddenGear(state) {
  return GEAR.filter((g) => !state.ownedGear.includes(g.id) && !unlockMet(state, g.unlock))
}

/**
 * Locations the player has unlocked.
 * @param {import('./state.js').GameState} state
 * @returns {Array<(typeof LOCATIONS)[number]>}
 */
export function unlockedLocations(state) {
  return LOCATIONS.filter((l) => unlockMet(state, l.unlock))
}

/**
 * Which console tabs are visible, given progress (progressive disclosure).
 * @param {import('./state.js').GameState} state
 * @returns {{ train: boolean, race: boolean, shop: boolean, journal: boolean }}
 */
export function tabsFor(state) {
  const flags = aggregateModifiers(state).flags
  return {
    train: true,
    race: maxDistanceKm(state.vitals) >= 1,
    shop: state.money > 0 || state.racesCompleted > 0,
    journal: flags.has('journal'),
  }
}

/**
 * Milestones earned by the CURRENT state. Pure — call after any action and
 * diff against `state.milestones` to find what's new.
 * @param {import('./state.js').GameState} state
 * @returns {string[]}
 */
export function earnedMilestones(state) {
  const maxKm = maxDistanceKm(state.vitals)
  const pbs = state.pbs
  const done = []
  const add = (id, cond) => cond && done.push(id)

  add('first_1k', maxKm >= 1)
  add('first_2k', maxKm >= 2)
  add('first_3k', maxKm >= 3)
  add('first_5k', maxKm >= 5)
  add('first_10k', maxKm >= 10)
  add('first_half', maxKm >= 21.097)
  add('first_marathon', maxKm >= 42.195)

  add('first_race', state.racesCompleted >= 1)
  add('first_win', state.raceResults.some((r) => r.place === 1))
  add('marathon_finish', state.raceResults.some((r) => r.distance >= 42195))

  const pb5k = pbs['5000']
  add('sub_30_5k', pb5k !== undefined && pb5k <= 1800)
  add('sub_25_5k', pb5k !== undefined && pb5k <= 1500)
  add('sub_20_5k', pb5k !== undefined && pb5k <= 1200)

  return done
}

/**
 * Milestone ids earned now but not yet recorded.
 * @param {import('./state.js').GameState} state
 * @returns {string[]}
 */
export function newMilestones(state) {
  return earnedMilestones(state).filter((id) => !state.milestones.includes(id))
}
