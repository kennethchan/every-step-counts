/**
 * Sim barrel — the single import surface for game logic.
 * Nothing in here imports Vue.
 */

export { createInitialState, cloneState, weekOf, SAVE_VERSION } from './state.js'
export { resolve } from './actions.js'
export { resolveSession } from './training.js'
export { simulateRace, chooseAutoPacing, playbackMs, isQualified } from './race.js'
export {
  predictTime,
  predictedPacePerKm,
  racePace,
  referenceTime,
  riegelExponent,
  vvo2max,
  sustainableFraction,
} from './performance.js'
export { gainMultiplier, addFatigue, clampFatigue } from './fatigue.js'
export {
  applyGains,
  maxDistanceKm,
  canCover,
  fitnessScore,
} from './vitals.js'
export {
  unlockedSessions,
  isSessionUnlocked,
  availableGear,
  hiddenGear,
  unlockedLocations,
  tabsFor,
  earnedMilestones,
  newMilestones,
  unlockMet,
} from './unlocks.js'
export { aggregateModifiers, gainMultiplierFor } from './modifiers.js'
export { createSeed } from './rng.js'
