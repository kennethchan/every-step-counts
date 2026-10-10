/**
 * Persistence: localStorage JSON with a version field and a migration path.
 *
 * Because the sim is deterministic and its whole state is serialisable, saving
 * is just "write the state object". Migration is a defensive merge so an older
 * save never produces a half-shaped object.
 */

import { SAVE_VERSION, createInitialState } from '@/sim/state.js'
import { START_VITALS } from '@/data/balance.js'

const KEY = 'running-incremental:save'

/**
 * Write state to localStorage.
 * @param {import('@/sim/state.js').GameState} state
 */
export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* storage full or unavailable — fail silently */
  }
}

/**
 * Read + migrate state, or null when there is no save.
 * @returns {import('@/sim/state.js').GameState | null}
 */
export function loadState() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    return migrate(JSON.parse(raw))
  } catch {
    return null
  }
}

/** Remove the save. */
export function clearSave() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}

/**
 * Bring an older/partial save up to the current shape. Defensive merge: the
 * fresh default fills any missing field, then the save's own values win.
 * @param {any} save
 * @returns {import('@/sim/state.js').GameState}
 */
export function migrate(save) {
  const base = createInitialState()
  if (!save || typeof save !== 'object') return base

  const merged = {
    ...base,
    ...save,
    version: SAVE_VERSION,
    vitals: { ...START_VITALS, ...(save.vitals ?? {}) },
    stats: {
      sessionsByType: { ...(save.stats?.sessionsByType ?? {}) },
      sessionsCompleted: save.stats?.sessionsCompleted ?? 0,
    },
    settings: { ...base.settings, ...(save.settings ?? {}) },
    pbs: { ...(save.pbs ?? {}) },
    ownedGear: [...(save.ownedGear ?? [])],
    milestones: [...(save.milestones ?? [])],
    raceResults: [...(save.raceResults ?? [])],
    vitalsHistory: [...(save.vitalsHistory ?? [])],
    recentEvents: [...(save.recentEvents ?? [])],
    activeSession: save.activeSession ?? null,
    pendingRace: save.pendingRace ?? null,
  }

  // A save made mid-session should not resume "in progress" — offline is paused.
  merged.activeSession = null

  return merged
}
