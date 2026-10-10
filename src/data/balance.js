/**
 * Central tuning surface.
 *
 * EVERY magic number in the simulation lives here. Change numbers here, not in
 * logic. The sim modules read from this file so that balancing never requires
 * touching code.
 *
 * @typedef {'capacity'|'efficiency'|'threshold'|'economy'|'speed'|'durability'} VitalId
 */

/**
 * The seven vitals. Six are directly trainable (0–100); `maxDistance` is
 * derived from durability + efficiency.
 * @type {readonly VitalId[]}
 */
export const VITALS = /** @type {const} */ ([
  'capacity',
  'efficiency',
  'threshold',
  'economy',
  'speed',
  'durability',
])

/** Human-facing labels + short descriptions for the vitals panel. */
export const VITAL_META = {
  capacity: { label: 'VO2 Max', short: 'Capacity', desc: 'Aerobic ceiling — the ceiling on everything.' },
  efficiency: { label: 'Aerobic Efficiency', short: 'Efficiency', desc: 'How much of that ceiling you can use, sustainably.' },
  threshold: { label: 'Lactate Threshold', short: 'Threshold', desc: 'Fraction of capacity you can hold. Sustain speed longer.' },
  economy: { label: 'Running Economy', short: 'Economy', desc: 'Speed per unit of effort. Form + strength.' },
  speed: { label: 'Top-End Speed', short: 'Speed', desc: 'Neuromuscular. Your kick, and short races.' },
  durability: { label: 'Durability', short: 'Durability', desc: 'Resistance to fading over distance. Extends your range.' },
}

/** Starting vitals for a genuine beginner. */
export const START_VITALS = /** @type {Record<VitalId, number>} */ ({
  capacity: 5,
  efficiency: 5,
  threshold: 4,
  economy: 6,
  speed: 3,
  durability: 2,
})

/** All vitals are on a 0–100 scale. */
export const VITAL_MIN = 0
export const VITAL_MAX = 100

/** Starting money. */
export const START_MONEY = 0

// ---------------------------------------------------------------------------
// maxDistance (the beginner's gate)
// ---------------------------------------------------------------------------

/**
 * Max sustainable distance is DERIVED from durability + efficiency so that
 * "getting fitter" automatically extends your range. Starts at 2.0 km — the
 * user's own "barely 2km" beginning — and scales toward marathon+.
 */
export const MAX_DISTANCE = {
  base: 2.0, // km at START_VITALS
  perDurability: 0.38, // km per point of durability above start
  perEfficiency: 0.2, // km per point of efficiency above start
}

/** Distances (metres) that gate racing + unlocks. */
export const DISTANCES = {
  km1: 1000,
  km2: 2000,
  km3: 3000,
  km5: 5000,
  km10: 10000,
  half: 21097,
  full: 42195,
}

// ---------------------------------------------------------------------------
// Fatigue
// ---------------------------------------------------------------------------

export const FATIGUE = {
  max: 100,
  /** gains multiplier floor when fully fatigued. */
  minGainMultiplier: 0.2,
  /** rest day recovery (subtracted). */
  restRecovery: 30,
  /** default recovery-run recovery (subtracted) — overridden per-session. */
  recoveryRunRecovery: 20,
}

// ---------------------------------------------------------------------------
// Performance model (vitals -> pace -> race times)
// ---------------------------------------------------------------------------

/**
 * Vitals are mapped to a race pace in m/s, then to a 5k reference time, then
 * projected to any distance with the Riegel formula:
 *
 *     T(d) = T_ref * (d / d_ref) ^ b
 *
 * `b` starts at 1.08 and durability LOWERs it — so a durable runner is better
 * at long distances. Runner "type" emerges from stats, it is not a choice.
 */
export const PERFORMANCE = {
  /** velocity at VO2max, metres/second, mapped from `capacity`.
   *  Untrained ~3.0 m/s; the compound multipliers below bring a beginner's
   *  SUSTAINED race pace to a plausible ~8:10/km jog, not a walk. */
  vvo2min: 3.0,
  vvo2max: 5.6,
  /** sustainable fraction of vVO2max, mapped from `threshold`. */
  fractionMin: 0.8,
  fractionMax: 0.92,
  /** pace multiplier from `economy`. */
  economyMin: 0.94,
  economyMax: 1.1,
  /** pace multiplier from `efficiency`. */
  efficiencyMin: 0.9,
  efficiencyMax: 1.06,
  /** reference distance used internally for the base performance (5k, metres). */
  refDistance: 5000,
  /** Riegel exponent at zero durability and its reduction at max durability. */
  riegelBase: 1.08,
  riegelDurabilityDrop: 0.11,
  /** absolute pace floor (m/s) so a zeroed runner still has a finite time. */
  minPace: 0.6,
}

// ---------------------------------------------------------------------------
// Race simulation
// ---------------------------------------------------------------------------

export const RACE = {
  /** how many competitors are generated per race. */
  fieldSize: 31,
  /** standard deviation of the field's ability (fraction of tier reference). */
  fieldSpread: 0.055,
  /** maximum per-segment random pace swing (fraction). */
  segmentLuck: 0.012,
  /** maximum total race-day variance applied to the player (fraction). */
  raceDayVariance: 0.02,
  /** pacing strategy profiles: multiplier applied at the start of the race and at the finish. */
  pacing: {
    even: { start: 1.0, end: 1.0, label: 'Even split' },
    negative: { start: 0.97, end: 1.03, label: 'Negative split' },
    positive: { start: 1.03, end: 0.96, label: 'Positive split' },
  },
  /** how strongly low durability amplifies a positive-split fade. */
  fadeDurabilityWeight: 0.9,
  /** top-end speed kick bonus in the final segment (max fraction). */
  kickBonus: 0.035,
  /** playback duration in ms, interpolated by distance between these. */
  playbackMs: { at1k: 16000, atFull: 110000 },
}

/**
 * Race tiers use ABSOLUTE real-world standards (a reference 5k time, in
 * seconds). You qualify by hitting the time; fields are generated around it.
 * Prizes scale by distance x tier x placement.
 *
 * `local` is deliberately soft (a casual fun-run field) so a genuine beginner
 * can be competitive in their very first races and then visibly climb.
 */
export const TIERS = [
  { id: 'local', name: 'Local', ref5k: 2400, qualifier: null, prize: 50 },
  { id: 'club', name: 'Club', ref5k: 1500, qualifier: 1500, prize: 150 },
  { id: 'regional', name: 'Regional', ref5k: 1260, qualifier: 1260, prize: 400 },
  { id: 'national', name: 'National', ref5k: 1080, qualifier: 1080, prize: 1000 },
  { id: 'elite', name: 'Elite', ref5k: 930, qualifier: 930, prize: 2500 },
]

/** prize = tierPrize * (distance/5000)^distanceExp * placementFactor, rounded. */
export const PRIZE = {
  distanceExp: 0.5,
  placementFactors: { 1: 1.0, 2: 0.6, 3: 0.4, top10pct: 0.25, other: 0.08 },
}

// ---------------------------------------------------------------------------
// Progression pacing (Standard: ~180 sessions / ~1.5–2 hrs)
// ---------------------------------------------------------------------------

export const PACING = {
  target: 'standard',
  targetSessions: 180,
  unlockRhythmSessions: 15,
  /** session repetition count before fast/skip becomes available. */
  fastModeUnlockRepeats: 3,
}

/** Milestone IDs surfaced to the UI for celebrations. */
export const MILESTONES = {
  FIRST_1K: 'first_1k',
  FIRST_2K: 'first_2k',
  FIRST_5K: 'first_5k',
  FIRST_10K: 'first_10k',
  FIRST_HALF: 'first_half',
  FIRST_MARATHON: 'first_marathon',
  FIRST_RACE: 'first_race',
  FIRST_WIN: 'first_win',
  SUB_30_5K: 'sub_30_5k',
  SUB_25_5K: 'sub_25_5k',
  SUB_20_5K: 'sub_20_5k',
  MARATHON_FINISH: 'marathon_finish',
}

export const START_DAY = 1
