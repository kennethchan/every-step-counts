/**
 * Race simulation — split by split, against a generated field.
 *
 * The player's predicted time comes from `performance.js`; the race then shapes
 * that total into per-segment paces using a pre-race pacing strategy and a
 * durability-dependent fade. The field is generated around the tier's absolute
 * reference standard. All randomness is drawn from the stored seed, so a save
 * reproduces an identical race.
 */

import { RACE, PRIZE, PERFORMANCE } from '@/data/balance.js'
import { getTier, getDistance } from '@/data/races.js'
import { MILESTONE_DEFS } from '@/data/milestones.js'
import { predictTime } from './performance.js'
import { aggregateModifiers } from './modifiers.js'
import { nextNormal } from './rng.js'
import { cloneState } from './state.js'
import { canCover } from './vitals.js'
import { newMilestones } from './unlocks.js'
import { fmtTime, fmtPaceOf, ordinal } from '@/utils/format.js'

function lerp(a, b, t) {
  return a + (b - a) * t
}

/**
 * Choose a sensible pacing strategy from the runner's profile.
 * @param {import('./state.js').Vitals} vitals
 * @param {number} distance
 * @returns {'even'|'negative'|'positive'}
 */
export function chooseAutoPacing(vitals, distance) {
  const short = distance <= 5000
  if (short && vitals.speed > 40) return 'positive'
  if (vitals.durability > 45) return 'negative'
  return 'even'
}

/**
 * Real-time playback length (ms) for a distance, interpolated by distance.
 * @param {number} distance
 * @returns {number}
 */
export function playbackMs(distance) {
  const { at1k, atFull } = RACE.playbackMs
  const t = Math.min(1, Math.max(0, (distance - 1000) / (42195 - 1000)))
  return Math.round(lerp(at1k, atFull, t))
}

/**
 * Is the runner qualified for a tier? (absolute standard on predicted 5k)
 * @param {import('./state.js').GameState} state
 * @param {string} tierId
 * @returns {boolean}
 */
export function isQualified(state, tierId) {
  const tier = getTier(tierId)
  if (!tier || tier.qualifier === null) return true
  const mods = aggregateModifiers(state)
  const predicted5k = predictTime(state.vitals, 5000, mods.racePaceMult)
  return predicted5k <= tier.qualifier
}

/**
 * @typedef {object} RaceOptions
 * @property {number} distance  metres
 * @property {string} tier      tier id
 * @property {'even'|'negative'|'positive'|'auto'} pacing
 */

/**
 * Simulate a race and apply the outcome.
 * @param {import('./state.js').GameState} state
 * @param {RaceOptions} options
 * @returns {{ state: import('./state.js').GameState, events: Array<object>, result: import('./state.js').RaceResult, lane: object }}
 */
export function simulateRace(state, options) {
  const dist = getDistance(options.distance)
  const tier = getTier(options.tier)
  if (!dist) throw new Error(`Unknown distance: ${options.distance}`)
  if (!tier) throw new Error(`Unknown tier: ${options.tier}`)
  if (!canCover(state.vitals, dist.metres)) {
    throw new Error(`Cannot yet cover ${dist.short} — extend your max distance first.`)
  }
  if (!isQualified(state, tier.id)) {
    throw new Error(`Not qualified for ${tier.name} — run a faster 5k first.`)
  }

  let s = state.seed
  const mods = aggregateModifiers(state)
  const n = dist.segments

  const pacingKey = options.pacing === 'auto' ? chooseAutoPacing(state.vitals, dist.metres) : options.pacing
  const profile = RACE.pacing[pacingKey] ?? RACE.pacing.even

  // --- player lane -----------------------------------------------------------
  const predicted = predictTime(state.vitals, dist.metres, mods.racePaceMult)
  const dayRoll = nextNormal(s)
  s = dayRoll.seed
  const raceDayMult = 1 + dayRoll.value * RACE.raceDayVariance
  const meanPace = dist.metres / (predicted * raceDayMult)

  const durNorm = state.vitals.durability / 100
  const fadeAmount = 0.06 * (1 - durNorm) * RACE.fadeDurabilityWeight
  const kickNorm = state.vitals.speed / 100

  /** @type {number[]} */
  const playerSplits = []
  /** @type {number[]} */
  const playerCumulative = []
  let cumulative = 0

  for (let i = 0; i < n; i++) {
    const p = n > 1 ? i / (n - 1) : 0
    const strat = lerp(profile.start, profile.end, p)
    // Fade: pace (m/s) DECREASES with progress; durability softens it.
    const fadeMult = 1 - fadeAmount * p
    const luckRoll = nextNormal(s)
    s = luckRoll.seed
    const luck = 1 + luckRoll.value * RACE.segmentLuck
    let pace = meanPace * strat * fadeMult * luck
    if (i === n - 1) pace *= 1 + RACE.kickBonus * kickNorm // final-segment kick: faster
    const segTime = dist.metres / n / Math.max(0.1, pace)
    playerSplits.push(segTime)
    cumulative += segTime
    playerCumulative.push(cumulative)
  }

  const playerTotal = cumulative

  // --- field -----------------------------------------------------------------
  const tierRefAtDist = tier.ref5k * Math.pow(dist.metres / 5000, 1.06)
  /** @type {Array<{ name: string, total: number, cumulative: number[] }>} */
  const competitors = []
  for (let c = 0; c < RACE.fieldSize - 1; c++) {
    const z = nextNormal(s)
    s = z.seed
    const strength = 1 + z.value * RACE.fieldSpread
    const total = tierRefAtDist * strength
    const tiltRoll = nextNormal(s)
    s = tiltRoll.seed
    const tilt = tiltRoll.value * 0.03 // >0 = positive split, <0 = negative split
    const cum = []
    for (let k = 0; k < n; k++) {
      const f = (k + 1) / n
      cum.push(total * f * (1 + tilt * (f - 1)))
    }
    competitors.push({ name: `Runner ${c + 1}`, total, cumulative: cum })
  }

  // --- positions per segment -------------------------------------------------
  /** @type {number[]} */
  const playerPositions = []
  for (let k = 0; k < n; k++) {
    const mine = playerCumulative[k]
    let ahead = 0
    for (const c of competitors) if (c.cumulative[k] < mine) ahead++
    playerPositions.push(ahead + 1)
  }

  const place = playerPositions[n - 1]
  const fieldSize = RACE.fieldSize

  // --- prize -----------------------------------------------------------------
  const placementFactor =
    place === 1
      ? PRIZE.placementFactors[1]
      : place === 2
        ? PRIZE.placementFactors[2]
        : place === 3
          ? PRIZE.placementFactors[3]
          : place <= Math.ceil(fieldSize * 0.1)
            ? PRIZE.placementFactors.top10pct
            : PRIZE.placementFactors.other

  const prize = Math.round(
    tier.prize * Math.pow(dist.metres / 5000, PRIZE.distanceExp) * placementFactor,
  )

  // --- apply -----------------------------------------------------------------
  const next = cloneState(state)
  next.seed = s
  next.money = state.money + prize
  next.racesCompleted = state.racesCompleted + 1
  next.day = state.day + 1

  const key = String(dist.metres)
  const previousPb = state.pbs[key]
  const roundedTotal = Math.round(playerTotal * 100) / 100
  const isPb = previousPb === undefined || roundedTotal < previousPb
  if (isPb) next.pbs = { ...next.pbs, [key]: roundedTotal }

  const round = (x) => Math.round(x * 100) / 100
  /** @type {import('./state.js').RaceResult} */
  const result = {
    day: next.day,
    distance: dist.metres,
    tier: tier.id,
    pacing: pacingKey,
    time: roundedTotal,
    place,
    fieldSize,
    prize,
    splits: playerSplits.map(round),
    isPb,
  }
  next.raceResults = [...next.raceResults, result]

  const events = []
  events.push({
    kind: 'race',
    day: next.day,
    text: `${dist.short} ${tier.name}: ${fmtTime(result.time)} · ${fmtPaceOf(result.time, dist.metres)} (${ordinal(place)}/${fieldSize})`,
    prize,
    isPb,
  })

  if (dist.metres >= 42195) next.outcome = 'credits'

  const gained = newMilestones(next)
  if (gained.length) {
    next.milestones = [...next.milestones, ...gained]
    for (const id of gained) {
      events.push({
        kind: 'milestone',
        day: next.day,
        milestoneId: id,
        text: MILESTONE_DEFS.find((m) => m.id === id)?.label ?? id,
      })
    }
  }

  next.recentEvents = [...events, ...next.recentEvents].slice(0, 30)

  const lane = {
    splits: playerSplits.map(round),
    cumulative: playerCumulative.map(round),
    positions: playerPositions,
    pacing: pacingKey,
  }

  return { state: next, events, result, lane }
}
