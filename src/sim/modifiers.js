/**
 * Aggregate the modifiers granted by all owned gear into a single object the
 * rest of the sim can read. Derived, never stored.
 */

import { GEAR } from '@/data/gear.js'

/**
 * @typedef {object} Modifiers
 * @property {Record<string, number>} gainMult         vital -> multiplier (may include `all`)
 * @property {Record<string, number>} sessionGainMult  sessionId -> multiplier
 * @property {number} restRecoveryBonus
 * @property {number} recoveryRunBonus
 * @property {number} racePaceMult
 * @property {Record<string, number>} fatigueMult
 * @property {Set<string>} flags
 */

/**
 * Merge every owned item's modifiers.
 * @param {import('./state.js').GameState} state
 * @returns {Modifiers}
 */
export function aggregateModifiers(state) {
  /** @type {Modifiers} */
  const mods = {
    gainMult: {},
    sessionGainMult: {},
    restRecoveryBonus: 0,
    recoveryRunBonus: 0,
    racePaceMult: 1,
    fatigueMult: {},
    flags: new Set(),
  }

  for (const id of state.ownedGear) {
    const gear = GEAR.find((g) => g.id === id)
    if (!gear) continue

    for (const flag of gear.flags) mods.flags.add(flag)

    const m = gear.modifiers
    if (m.gainMult) {
      for (const [k, v] of Object.entries(m.gainMult)) {
        mods.gainMult[k] = (mods.gainMult[k] ?? 1) * v
      }
    }
    if (m.sessionGainMult) {
      for (const [k, v] of Object.entries(m.sessionGainMult)) {
        mods.sessionGainMult[k] = (mods.sessionGainMult[k] ?? 1) * v
      }
    }
    if (m.fatigueMult) {
      for (const [k, v] of Object.entries(m.fatigueMult)) {
        mods.fatigueMult[k] = (mods.fatigueMult[k] ?? 1) * v
      }
    }
    if (m.restRecoveryBonus) mods.restRecoveryBonus += m.restRecoveryBonus
    if (m.recoveryRunBonus) mods.recoveryRunBonus += m.recoveryRunBonus
    if (m.racePaceMult) mods.racePaceMult *= m.racePaceMult
  }

  return mods
}

/**
 * Multiplier applied to a given vital's gains for a given session.
 * @param {Modifiers} mods
 * @param {string} vital
 * @param {string} sessionId
 * @returns {number}
 */
export function gainMultiplierFor(mods, vital, sessionId) {
  return (mods.gainMult[vital] ?? 1) * (mods.gainMult.all ?? 1) * (mods.sessionGainMult[sessionId] ?? 1)
}
