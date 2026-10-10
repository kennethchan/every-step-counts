/**
 * Gear catalogue — plain data.
 *
 * Two kinds of unlock:
 *   - efficiency items modify numbers (recovery, gains)
 *   - capability items add a MECHANIC or SCREEN (predicted times, journal,
 *     strides/drills, coach suggestions)
 *
 * Availability is MILESTONE-GATED (an item appears once its unlock is met) and
 * then purchased with race prize money. Purchases are permanent — no wear.
 *
 * @typedef {object} GearModifiers
 * @property {Record<string, number>} [gainMult]         vital -> multiplier, or `all`
 * @property {Record<string, number>} [sessionGainMult]  sessionId -> multiplier
 * @property {number} [restRecoveryBonus]                extra fatigue healed on rest
 * @property {number} [recoveryRunBonus]                 extra fatigue healed on a recovery run
 * @property {number} [racePaceMult]                     race-day pace multiplier
 * @property {Record<string, number>} [fatigueMult]      sessionId -> fatigue multiplier
 */

/**
 * @typedef {object} GearDef
 * @property {string} id
 * @property {string} name
 * @property {'shoes'|'tech'|'recovery'|'facility'} category
 * @property {number} price
 * @property {number} tier
 * @property {{ milestone?: string, race?: { distance?: number, tier?: string }, maxDistance?: number }|null} unlock
 * @property {string[]} flags
 * @property {GearModifiers} modifiers
 * @property {string} desc
 */

/** @type {GearDef[]} */
export const GEAR = [
  // --- Shoes -----------------------------------------------------------------
  {
    id: 'cushioned_trainers',
    name: 'Cushioned Trainers',
    category: 'shoes',
    price: 300,
    tier: 1,
    unlock: { maxDistance: 3 },
    flags: [],
    modifiers: { gainMult: { economy: 1.05 }, fatigueMult: { easy: 0.9, long: 0.9 } },
    desc: 'Softer landing. Easier on easy + long runs, slightly less economical.',
  },
  {
    id: 'tempo_shoes',
    name: 'Lightweight Tempo Shoes',
    category: 'shoes',
    price: 700,
    tier: 2,
    unlock: { milestone: 'first_race' },
    flags: [],
    modifiers: { gainMult: { economy: 1.08 }, sessionGainMult: { tempo: 1.1 } },
    desc: 'Lighter and snappier for quality sessions.',
  },
  {
    id: 'carbon_racers',
    name: 'Carbon Racers',
    category: 'shoes',
    price: 2000,
    tier: 3,
    unlock: { race: { distance: 10000 } },
    flags: [],
    modifiers: { racePaceMult: 1.04 },
    desc: 'Plated race shoes. A real step up on race day.',
  },

  // --- Tech / information (capability unlocks) -------------------------------
  {
    id: 'gps_watch',
    name: 'GPS Watch',
    category: 'tech',
    price: 200,
    tier: 1,
    unlock: null,
    flags: ['predictedTimes'],
    modifiers: {},
    desc: 'Reveals your predicted race times and splits.',
  },
  {
    id: 'training_log',
    name: 'Training Log',
    category: 'tech',
    price: 250,
    tier: 1,
    unlock: null,
    flags: ['journal'],
    modifiers: {},
    desc: 'Opens the Journal: personal bests, milestones and charts.',
  },
  {
    id: 'hr_monitor',
    name: 'Heart Rate Monitor',
    category: 'tech',
    price: 600,
    tier: 2,
    unlock: { milestone: 'first_5k' },
    flags: ['preciseFatigue'],
    modifiers: { gainMult: { threshold: 1.05 } },
    desc: 'Precise fatigue readings, and better threshold feedback.',
  },
  {
    id: 'lactate_testing',
    name: 'Lactate Testing',
    category: 'tech',
    price: 1500,
    tier: 3,
    unlock: { milestone: 'sub_30_5k' },
    flags: [],
    modifiers: { gainMult: { threshold: 1.1 } },
    desc: 'Precise threshold measurement. Bigger tempo gains.',
  },

  // --- Recovery (efficiency) -------------------------------------------------
  {
    id: 'foam_roller',
    name: 'Foam Roller',
    category: 'recovery',
    price: 150,
    tier: 1,
    unlock: null,
    flags: [],
    modifiers: { restRecoveryBonus: 2 },
    desc: 'Rest days heal a little more.',
  },
  {
    id: 'better_sleep',
    name: 'Better Sleep',
    category: 'recovery',
    price: 400,
    tier: 1,
    unlock: { milestone: 'first_race' },
    flags: [],
    modifiers: { restRecoveryBonus: 2, recoveryRunBonus: 2 },
    desc: 'Recovery of every kind improves.',
  },
  {
    id: 'massage_gun',
    name: 'Massage Gun',
    category: 'recovery',
    price: 700,
    tier: 2,
    unlock: { maxDistance: 10 },
    flags: [],
    modifiers: { restRecoveryBonus: 5 },
    desc: 'Rest days heal substantially more.',
  },
  {
    id: 'nutrition_plan',
    name: 'Nutrition Plan',
    category: 'recovery',
    price: 1200,
    tier: 3,
    unlock: { maxDistance: 21 },
    flags: [],
    modifiers: { restRecoveryBonus: 4, gainMult: { durability: 1.05 } },
    desc: 'Fuelling dialled in. Better durability gains.',
  },
  {
    id: 'compression_boots',
    name: 'Compression Boots',
    category: 'recovery',
    price: 1800,
    tier: 4,
    unlock: { maxDistance: 30 },
    flags: [],
    modifiers: { restRecoveryBonus: 8, recoveryRunBonus: 5 },
    desc: 'Elite-level recovery. Rest and recovery runs both improve.',
  },

  // --- Facilities / coaching (capability, big purchases) ---------------------
  {
    id: 'track_access',
    name: 'Track Access',
    category: 'facility',
    price: 800,
    tier: 2,
    unlock: { milestone: 'first_race' },
    flags: ['strides', 'drills'],
    modifiers: { sessionGainMult: { intervals: 1.1 } },
    desc: 'Enables Strides and Drills, and sharpens intervals.',
  },
  {
    id: 'gym_membership',
    name: 'Gym Membership',
    category: 'facility',
    price: 900,
    tier: 2,
    unlock: { maxDistance: 5 },
    flags: [],
    modifiers: { gainMult: { economy: 1.1 } },
    desc: 'Strength work improves running economy.',
  },
  {
    id: 'club_coach',
    name: 'Club Coach',
    category: 'facility',
    price: 2500,
    tier: 3,
    unlock: { race: { distance: 10000 } },
    flags: ['coach'],
    modifiers: { gainMult: { all: 1.08 } },
    desc: 'Suggests your next session and lifts all gains.',
  },
  {
    id: 'altitude_room',
    name: 'Altitude Room',
    category: 'facility',
    price: 5000,
    tier: 4,
    unlock: { maxDistance: 21 },
    flags: ['altitude'],
    modifiers: { gainMult: { capacity: 1.15 } },
    desc: 'Living high. A big multiplier on aerobic capacity.',
  },
]

/** Category display order + labels. */
export const GEAR_CATEGORIES = [
  { id: 'shoes', label: 'Shoes' },
  { id: 'tech', label: 'Tech' },
  { id: 'recovery', label: 'Recovery' },
  { id: 'facility', label: 'Facilities' },
]

/**
 * Look up a gear definition.
 * @param {string} id
 * @returns {GearDef | undefined}
 */
export function getGear(id) {
  return GEAR.find((g) => g.id === id)
}
