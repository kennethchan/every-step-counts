/**
 * The performance model — the soul of the game.
 *
 * Vitals -> race pace (m/s) -> a 5k reference time -> any distance via Riegel:
 *
 *     T(d) = T_ref * (d / d_ref) ^ b
 *
 * `b` starts above the classic 1.06 and durability LOWERS it, so a durable
 * runner loses less over long distances. A 5k specialist and a marathoner
 * emerge from the same stats without the player picking a "type".
 *
 * All maths is pure and inspectable.
 */

import { PERFORMANCE } from '@/data/balance.js'

/**
 * Linear interpolation helper.
 * @param {number} a
 * @param {number} b
 * @param {number} t  0..1
 * @returns {number}
 */
function lerp(a, b, t) {
  return a + (b - a) * t
}

/** Normalise a 0–100 vital to 0..1. */
function norm(value) {
  return Math.max(0, Math.min(1, value / 100))
}

/**
 * Velocity at VO2max (m/s) from `capacity`.
 * @param {number} capacity
 * @returns {number}
 */
export function vvo2max(capacity) {
  return lerp(PERFORMANCE.vvo2min, PERFORMANCE.vvo2max, norm(capacity))
}

/**
 * Sustainable fraction of vVO2max from `threshold`.
 * @param {number} threshold
 * @returns {number}
 */
export function sustainableFraction(threshold) {
  return lerp(PERFORMANCE.fractionMin, PERFORMANCE.fractionMax, norm(threshold))
}

/**
 * Current race pace in m/s.
 * @param {import('./state.js').Vitals} vitals
 * @param {number} [paceMult]  gear multiplier (e.g. carbon shoes)
 * @returns {number}
 */
export function racePace(vitals, paceMult = 1) {
  const v = vvo2max(vitals.capacity)
  const f = sustainableFraction(vitals.threshold)
  const ec = lerp(PERFORMANCE.economyMin, PERFORMANCE.economyMax, norm(vitals.economy))
  const ef = lerp(PERFORMANCE.efficiencyMin, PERFORMANCE.efficiencyMax, norm(vitals.efficiency))
  return Math.max(PERFORMANCE.minPace, v * f * ec * ef * paceMult)
}

/**
 * Reference performance: the runner's 5k-equivalent time in seconds.
 * @param {import('./state.js').Vitals} vitals
 * @param {number} [paceMult]
 * @returns {number}
 */
export function referenceTime(vitals, paceMult = 1) {
  return PERFORMANCE.refDistance / racePace(vitals, paceMult)
}

/**
 * Riegel exponent for this runner. Durable runners get a lower exponent and are
 * therefore relatively better at long distances.
 * @param {number} durability
 * @returns {number}
 */
export function riegelExponent(durability) {
  return PERFORMANCE.riegelBase - norm(durability) * PERFORMANCE.riegelDurabilityDrop
}

/**
 * Predicted time (seconds) over a distance.
 * @param {import('./state.js').Vitals} vitals
 * @param {number} distanceMetres
 * @param {number} [paceMult]
 * @returns {number}
 */
export function predictTime(vitals, distanceMetres, paceMult = 1) {
  const tref = referenceTime(vitals, paceMult)
  const b = riegelExponent(vitals.durability)
  return tref * Math.pow(distanceMetres / PERFORMANCE.refDistance, b)
}

/**
 * Predicted race pace in seconds per km (convenience for UI).
 * @param {import('./state.js').Vitals} vitals
 * @param {number} distanceMetres
 * @param {number} [paceMult]
 * @returns {number}
 */
export function predictedPacePerKm(vitals, distanceMetres, paceMult = 1) {
  return predictTime(vitals, distanceMetres, paceMult) / (distanceMetres / 1000)
}
