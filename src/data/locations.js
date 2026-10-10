/**
 * Locations — unlocked as milestone rewards (a fresh view each tier, the
 * celebration reward that never runs out).
 *
 * Each location carries a parallax palette; the stage renders layers from it.
 */

/**
 * @typedef {object} LocationDef
 * @property {string} id
 * @property {string} name
 * @property {{ maxDistance?: number, race?: { distance?: number, tier?: string }, milestone?: string }|null} unlock
 * @property {{ sky: string, far: string, mid: string, near: string, ground: string }} palette
 * @property {string} desc
 */

/** @type {LocationDef[]} */
export const LOCATIONS = [
  {
    id: 'park',
    name: 'The Park',
    unlock: null,
    palette: { sky: '#8ecae6', far: '#b8d8b0', mid: '#7fb069', near: '#5a8f4a', ground: '#a98467' },
    desc: 'Where it all begins.',
  },
  {
    id: 'city',
    name: 'City Streets',
    unlock: { maxDistance: 5 },
    palette: { sky: '#6c8ebf', far: '#5c6b8a', mid: '#4a5570', near: '#3a4256', ground: '#6b6b6b' },
    desc: 'Concrete, traffic, and early mornings.',
  },
  {
    id: 'riverside',
    name: 'Riverside',
    unlock: { maxDistance: 10 },
    palette: { sky: '#a8dadc', far: '#7fb3b5', mid: '#457b9d', near: '#37596e', ground: '#b08968' },
    desc: 'Long, flat, meditative.',
  },
  {
    id: 'forest',
    name: 'Forest Trails',
    unlock: { maxDistance: 21.097 },
    palette: { sky: '#95c98a', far: '#4f772d', mid: '#31572c', near: '#22301b', ground: '#8a6a4a' },
    desc: 'Soft ground and relentless hills.',
  },
  {
    id: 'mountains',
    name: 'Mountains',
    unlock: { maxDistance: 42.195 },
    palette: { sky: '#cfe0e8', far: '#8a9ba8', mid: '#5d6b78', near: '#3b4650', ground: '#7d7469' },
    desc: 'Thin air, big days.',
  },
  {
    id: 'stadium',
    name: 'The Stadium',
    unlock: { race: { distance: 5000, tier: 'national' } },
    palette: { sky: '#22303c', far: '#2f4657', mid: '#c1121f', near: '#780000', ground: '#e07a5f' },
    desc: 'The big stage. Everything on the line.',
  },
]

/**
 * Look up a location definition.
 * @param {string} id
 * @returns {LocationDef | undefined}
 */
export function getLocation(id) {
  return LOCATIONS.find((l) => l.id === id)
}
