/**
 * Game state shape + factory.
 *
 * The sim is action-driven, not time-stepped: pure functions take a state and
 * an action and return a new state plus a list of events. Nothing here imports
 * Vue. Derived values (unlocks, max distance, tabs) are computed on read by the
 * other sim modules so the shape stays small and save-friendly.
 */

import { START_VITALS, START_MONEY, START_DAY } from '@/data/balance.js'
import { createSeed } from './rng.js'
import { maxDistanceKm } from './vitals.js'

/** Bump when the persisted shape changes; `migrate` handles upgrades. */
export const SAVE_VERSION = 1

/**
 * @typedef {object} Vitals
 * @property {number} capacity
 * @property {number} efficiency
 * @property {number} threshold
 * @property {number} economy
 * @property {number} speed
 * @property {number} durability
 */

/**
 * @typedef {object} SessionDef
 * @property {string} id
 * @property {string} name
 * @property {number} intensity  0–5, drives sprite pacing
 * @property {number} days       calendar days consumed
 * @property {Record<string, number>} gains  vital -> amount (flat per session)
 * @property {number} fatigue    added to fatigue (may be negative for recovery)
 * @property {string} scene      pacing profile key for RunnerScene
 * @property {object|null} unlock  vitals-threshold condition
 * @property {string} [desc]
 */

/**
 * @typedef {object} RaceResult
 * @property {number} day
 * @property {number} distance   metres
 * @property {string} tier
 * @property {string} pacing
 * @property {number} time       seconds
 * @property {number} place
 * @property {number} fieldSize
 * @property {number} prize
 * @property {number[]} splits   seconds per segment
 * @property {boolean} isPb
 */

/**
 * @typedef {object} GameState
 * @property {number} version
 * @property {number} seed
 * @property {number} day
 * @property {number} money
 * @property {Vitals} vitals
 * @property {number} fatigue
 * @property {string[]} ownedGear
 * @property {number} racesCompleted
 * @property {RaceResult[]} raceResults
 * @property {Record<string, number>} pbs         distance(m) -> seconds
 * @property {string[]} milestones
 * @property {{ sessionsByType: Record<string, number>, sessionsCompleted: number }} stats
 * @property {Array<{ day: number, vitals: Vitals, maxDistance: number }>} vitalsHistory
 * @property {Array<{ day: number, text: string, kind: string }>} recentEvents
 * @property {object|null} activeSession
 * @property {object|null} pendingRace
 * @property {{ fastMode: boolean, autoFastMode: boolean }} settings
 * @property {string} location   currently displayed location id
 * @property {string|null} outcome   null | 'credits'
 */

/**
 * Create a fresh game state for a brand-new runner.
 * @param {number} [seed]
 * @returns {GameState}
 */
export function createInitialState(seed = createSeed()) {
  const vitals = { ...START_VITALS }
  return {
    version: SAVE_VERSION,
    seed,
    day: START_DAY,
    money: START_MONEY,
    vitals,
    fatigue: 0,
    ownedGear: [],
    racesCompleted: 0,
    raceResults: [],
    pbs: {},
    milestones: [],
    stats: { sessionsByType: {}, sessionsCompleted: 0 },
    // Seed the day-1 baseline so progression charts have a starting point.
    vitalsHistory: [{ day: START_DAY, vitals: { ...vitals }, maxDistance: maxDistanceKm(vitals) }],
    recentEvents: [],
    activeSession: null,
    pendingRace: null,
    settings: { fastMode: false, autoFastMode: true },
    location: 'park',
    outcome: null,
  }
}

/**
 * In-game week number (1-based), derived from the day counter.
 * @param {GameState} state
 * @returns {number}
 */
export function weekOf(state) {
  return Math.floor((state.day - 1) / 7) + 1
}

/**
 * Deep-ish clone used by the sim before applying changes, so callers keep the
 * previous state for undo/testing and Vue reactivity sees a new object.
 * @param {GameState} state
 * @returns {GameState}
 */
export function cloneState(state) {
  return {
    ...state,
    vitals: { ...state.vitals },
    ownedGear: [...state.ownedGear],
    raceResults: [...state.raceResults],
    pbs: { ...state.pbs },
    milestones: [...state.milestones],
    stats: { sessionsByType: { ...state.stats.sessionsByType }, sessionsCompleted: state.stats.sessionsCompleted },
    vitalsHistory: [...state.vitalsHistory],
    recentEvents: [...state.recentEvents],
    settings: { ...state.settings },
    activeSession: state.activeSession ? { ...state.activeSession } : null,
    pendingRace: state.pendingRace ? { ...state.pendingRace } : null,
  }
}
