/**
 * Milestone metadata — the "trophy shelf" and celebration triggers.
 *
 * Conditions are evaluated in `sim/unlocks.js`; this file only describes what
 * each milestone is called and how it is categorised.
 */

/**
 * @typedef {'distance'|'race'|'performance'} MilestoneKind
 * @typedef {object} MilestoneDef
 * @property {string} id
 * @property {string} label
 * @property {MilestoneKind} kind
 */

/** @type {MilestoneDef[]} */
export const MILESTONE_DEFS = [
  { id: 'first_1k', label: 'First 1km covered', kind: 'distance' },
  { id: 'first_2k', label: 'First 2km covered', kind: 'distance' },
  { id: 'first_3k', label: 'First 3km covered', kind: 'distance' },
  { id: 'first_5k', label: 'First 5km covered', kind: 'distance' },
  { id: 'first_10k', label: 'First 10km covered', kind: 'distance' },
  { id: 'first_half', label: 'Half marathon covered', kind: 'distance' },
  { id: 'first_marathon', label: 'Marathon distance covered', kind: 'distance' },
  { id: 'first_race', label: 'First race completed', kind: 'race' },
  { id: 'first_win', label: 'First race win', kind: 'race' },
  { id: 'sub_30_5k', label: 'Sub-30 5k', kind: 'performance' },
  { id: 'sub_25_5k', label: 'Sub-25 5k', kind: 'performance' },
  { id: 'sub_20_5k', label: 'Sub-20 5k', kind: 'performance' },
  { id: 'marathon_finish', label: 'Marathon finished', kind: 'race' },
]

/**
 * Look up milestone metadata.
 * @param {string} id
 * @returns {MilestoneDef | undefined}
 */
export function getMilestone(id) {
  return MILESTONE_DEFS.find((m) => m.id === id)
}
