/**
 * Fatigue — a single 0–100 resource.
 *
 * Higher fatigue scales DOWN the gains of your next session, which is the whole
 * tension valve: hard sessions self-limit because spamming them wastes them.
 * Rest recovers more than a recovery run, but a recovery run also earns a
 * sliver of aerobic progress — so the two are a real choice, not redundant.
 */

import { FATIGUE } from '@/data/balance.js'

/**
 * Clamp a fatigue value into 0..max.
 * @param {number} value
 * @returns {number}
 */
export function clampFatigue(value) {
  return Math.max(0, Math.min(FATIGUE.max, value))
}

/**
 * Multiplier applied to a session's gains given current fatigue.
 * At 0 fatigue → 1.0; at max fatigue → minGainMultiplier.
 * @param {number} fatigue
 * @returns {number}
 */
export function gainMultiplier(fatigue) {
  const raw = 1 - fatigue / FATIGUE.max
  return Math.max(FATIGUE.minGainMultiplier, Math.min(1, raw))
}

/**
 * Add (or subtract) fatigue, clamped.
 * @param {number} fatigue
 * @param {number} amount
 * @returns {number}
 */
export function addFatigue(fatigue, amount) {
  return clampFatigue(fatigue + amount)
}
