/**
 * Training session catalogue — plain data.
 *
 * Every session moves a DIFFERENT primary vital, so the choice between them is
 * real rather than cosmetic. Gains are flat per execution (no progressive
 * overload — a deliberate design choice); progression instead comes from
 * unlocking new session types and from vitals climbing toward their caps.
 *
 * `unlock` conditions are all-required: each named vital must be at or above
 * the threshold, and each named flag must be set.
 *
 * @typedef {object} UnlockCondition
 * @property {number} [capacity]
 * @property {number} [efficiency]
 * @property {number} [threshold]
 * @property {number} [economy]
 * @property {number} [speed]
 * @property {number} [durability]
 * @property {string} [flag]   capability flag, e.g. 'strides' | 'drills'
 */

/**
 * @type {Array<import('@/sim/state.js').SessionDef & { rest?: boolean }>}
 */
export const SESSIONS = [
  {
    id: 'rest',
    name: 'Rest Day',
    intensity: 0,
    days: 1,
    gains: {},
    fatigue: -30,
    scene: 'idle',
    unlock: null,
    rest: true,
    desc: 'Recover the most. No gains, but fatigue drops hard.',
  },
  {
    id: 'runwalk',
    name: 'Run / Walk',
    intensity: 1,
    days: 1,
    gains: { efficiency: 1.2, durability: 1.2, capacity: 0.8 },
    fatigue: 3,
    scene: 'walk-run',
    unlock: null,
    desc: 'How every beginner starts. Builds base and range with almost no cost.',
  },
  {
    id: 'recovery',
    name: 'Recovery Run',
    intensity: 1,
    days: 1,
    gains: { efficiency: 0.3 },
    fatigue: -20,
    scene: 'slow-jog',
    unlock: null,
    desc: 'Very easy. Clears fatigue and still nudges aerobic base.',
  },
  {
    id: 'easy',
    name: 'Easy Run',
    intensity: 2,
    days: 1,
    gains: { efficiency: 1.1, durability: 0.5, capacity: 0.5, threshold: 0.15 },
    fatigue: 6,
    scene: 'steady',
    unlock: null,
    desc: 'The bread and butter of aerobic base.',
  },
  {
    id: 'long',
    name: 'Long Run',
    intensity: 2,
    days: 1,
    gains: { durability: 2.0, efficiency: 0.6, capacity: 0.4, threshold: 0.2, economy: 0.2 },
    fatigue: 14,
    scene: 'slow-endurance',
    unlock: { durability: 12 },
    desc: 'Builds durability — resistance to fading — and extends your range.',
  },
  {
    id: 'tempo',
    name: 'Tempo Run',
    intensity: 3,
    days: 1,
    gains: { threshold: 1.8, efficiency: 0.4, economy: 0.3 },
    fatigue: 16,
    scene: 'brisk',
    unlock: { efficiency: 25 },
    desc: 'Comfortably hard. Raises your lactate threshold.',
  },
  {
    id: 'intervals',
    name: 'Intervals',
    intensity: 4,
    days: 1,
    gains: { capacity: 2.0, speed: 0.8, economy: 0.4, threshold: 0.3 },
    fatigue: 22,
    scene: 'sprint-bursts',
    unlock: { capacity: 25 },
    desc: "Raises VO2 max and cardiovascular power. Expensive in fatigue.",
  },
  {
    id: 'strides',
    name: 'Strides',
    intensity: 3,
    days: 1,
    gains: { speed: 1.2, economy: 0.3 },
    fatigue: 2,
    scene: 'quick-bursts',
    unlock: { flag: 'strides' },
    desc: 'Short, fast pickups. Nearly free top-end speed.',
  },
  {
    id: 'drills',
    name: 'Drills',
    intensity: 1,
    days: 1,
    gains: { economy: 1.2 },
    fatigue: 1,
    scene: 'varied',
    unlock: { flag: 'drills' },
    desc: 'Form work. Improves running economy.',
  },
  {
    id: 'fartlek',
    name: 'Fartlek',
    intensity: 3,
    days: 1,
    gains: { threshold: 1.0, capacity: 0.8, speed: 0.4, economy: 0.3 },
    fatigue: 15,
    scene: 'surges',
    unlock: { threshold: 35 },
    desc: 'Speed play — a spread of threshold and capacity gains.',
  },
  {
    id: 'hills',
    name: 'Hill Repeats',
    intensity: 4,
    days: 1,
    gains: { capacity: 1.2, economy: 1.0, speed: 0.5, durability: 0.3 },
    fatigue: 22,
    scene: 'effortful',
    unlock: { capacity: 45, economy: 12 },
    desc: 'Strength endurance. Big economy and capacity, heavy fatigue.',
  },
]

/**
 * Look up a session definition by id.
 * @param {string} id
 * @returns {(typeof SESSIONS)[number] | undefined}
 */
export function getSession(id) {
  return SESSIONS.find((s) => s.id === id)
}
