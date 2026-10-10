/**
 * Vitals helpers: applying gains with cap clamping, and the derived
 * max-sustainable-distance that gates racing milestones.
 */

import { VITALS, VITAL_MIN, VITAL_MAX, MAX_DISTANCE, START_VITALS } from '@/data/balance.js'

/**
 * Clamp a single vital into range.
 * @param {number} value
 * @returns {number}
 */
export function clampVital(value) {
  return Math.max(VITAL_MIN, Math.min(VITAL_MAX, value))
}

/**
 * Apply a set of gains to vitals, clamped to caps. Returns a NEW vitals object.
 * Flat per-session gains — no progressive overload (deliberate design choice).
 * @param {import('./state.js').Vitals} vitals
 * @param {Record<string, number>} gains
 * @param {number} [multiplier]  overall gain multiplier (fatigue, gear)
 * @returns {import('./state.js').Vitals}
 */
export function applyGains(vitals, gains, multiplier = 1) {
  /** @type {any} */
  const next = { ...vitals }
  for (const vital of VITALS) {
    const amount = gains[vital]
    if (!amount) continue
    next[vital] = clampVital(next[vital] + amount * multiplier)
  }
  return next
}

/**
 * Max sustainable distance in km, DERIVED from durability + efficiency so that
 * getting fitter automatically extends your range. Starts at 2.0 km and grows
 * toward (and past) marathon distance.
 * @param {import('./state.js').Vitals} vitals
 * @returns {number}
 */
export function maxDistanceKm(vitals) {
  const d = vitals.durability - START_VITALS.durability
  const e = vitals.efficiency - START_VITALS.efficiency
  return MAX_DISTANCE.base + d * MAX_DISTANCE.perDurability + e * MAX_DISTANCE.perEfficiency
}

/**
 * Can the runner currently cover this distance?
 * @param {import('./state.js').Vitals} vitals
 * @param {number} distanceMetres
 * @returns {boolean}
 */
export function canCover(vitals, distanceMetres) {
  return maxDistanceKm(vitals) * 1000 >= distanceMetres
}

/**
 * Overall fitness score (0–100), a convenience summary for the UI.
 * @param {import('./state.js').Vitals} vitals
 * @returns {number}
 */
export function fitnessScore(vitals) {
  const sum = VITALS.reduce((acc, v) => acc + vitals[v], 0)
  return sum / VITALS.length
}
