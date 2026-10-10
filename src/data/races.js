/**
 * Race distances + field metadata.
 *
 * Distance set is deliberately granular at the short end so an absolute
 * beginner can race (and win a celebration) within minutes of starting.
 */

import { DISTANCES, TIERS } from './balance.js'

/**
 * @typedef {object} DistanceMeta
 * @property {number} metres
 * @property {string} label
 * @property {string} short
 * @property {number} segments  number of splits to simulate
 */

/** @type {DistanceMeta[]} */
export const RACE_DISTANCES = [
  { metres: DISTANCES.km1, label: '1 kilometre', short: '1k', segments: 4 },
  { metres: DISTANCES.km2, label: '2 kilometres', short: '2k', segments: 4 },
  { metres: DISTANCES.km3, label: '3 kilometres', short: '3k', segments: 6 },
  { metres: DISTANCES.km5, label: '5 kilometres', short: '5k', segments: 5 },
  { metres: DISTANCES.km10, label: '10 kilometres', short: '10k', segments: 5 },
  { metres: DISTANCES.half, label: 'Half Marathon', short: 'Half', segments: 7 },
  { metres: DISTANCES.full, label: 'Marathon', short: 'Full', segments: 8 },
]

export { TIERS }

/**
 * Look up a distance descriptor.
 * @param {number} metres
 * @returns {DistanceMeta | undefined}
 */
export function getDistance(metres) {
  return RACE_DISTANCES.find((d) => d.metres === metres)
}

/**
 * Look up a tier descriptor.
 * @param {string} id
 * @returns {(typeof TIERS)[number] | undefined}
 */
export function getTier(id) {
  return TIERS.find((t) => t.id === id)
}
