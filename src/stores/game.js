/**
 * Pinia store — the bridge between the pure sim and Vue.
 *
 * The store owns the authoritative `state` object and exposes derived,
 * reactive getters for the UI. Components NEVER mutate state directly: they
 * dispatch actions, which run the pure reducer and mirror the result back.
 *
 * Progressive disclosure lives here too: whether predicted times, precise
 * fatigue and the journal are visible depends on gear the player owns.
 */

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  createInitialState,
  resolve,
  unlockedSessions,
  availableGear,
  hiddenGear,
  unlockedLocations,
  tabsFor,
  maxDistanceKm,
  aggregateModifiers,
  predictTime,
  weekOf,
  fitnessScore,
} from '@/sim/index.js'
import { SESSIONS } from '@/data/sessions.js'
import { RACE_DISTANCES, TIERS } from '@/data/races.js'
import { getLocation } from '@/data/locations.js'
import { MILESTONE_DEFS } from '@/data/milestones.js'
import { PACING } from '@/data/balance.js'
import { loadState, saveState, clearSave } from '@/composables/useSave.js'

export const useGameStore = defineStore('game', () => {
  // --- authoritative state ---------------------------------------------------
  const state = ref(loadState() ?? createInitialState())

  // --- UI-only state ---------------------------------------------------------
  /** Queue of milestone events to celebrate. */
  const celebrations = ref([])
  /** Result of the most recent session, for the floating-delta feedback. */
  const lastSession = ref(null)
  /** Active race playback payload, or null. */
  const race = ref(null)
  /** Transient API errors surfaced to the UI. */
  const error = ref(null)

  function persist() {
    saveState(state.value)
  }

  /**
   * Dispatch a sim action. The only way state changes.
   * @param {import('@/sim/actions.js').Action} action
   */
  function dispatch(action) {
    const result = resolve(state.value, action)
    state.value = result.state
    for (const ev of result.events ?? []) {
      if (ev.kind === 'milestone') celebrations.value.push(ev)
      if (ev.kind === 'session') lastSession.value = ev
    }
    error.value = null
    persist()
    return result
  }

  /** Dismiss the next celebration in the queue. */
  function nextCelebration() {
    return celebrations.value.shift()
  }

  /** Clear transient session feedback. */
  function clearLastSession() {
    lastSession.value = null
  }

  // --- derived: headline numbers ---------------------------------------------
  const vitals = computed(() => state.value.vitals)
  const day = computed(() => state.value.day)
  const week = computed(() => weekOf(state.value))
  const money = computed(() => state.value.money)
  const fatigue = computed(() => state.value.fatigue)
  const maxKm = computed(() => maxDistanceKm(state.value.vitals))
  const fitness = computed(() => fitnessScore(state.value.vitals))
  const mods = computed(() => aggregateModifiers(state.value))
  const flags = computed(() => mods.value.flags)
  const outcome = computed(() => state.value.outcome)
  const settings = computed(() => state.value.settings)
  const location = computed(() => getLocation(state.value.location))

  // --- derived: disclosure ---------------------------------------------------
  const showPredictedTimes = computed(() => flags.value.has('predictedTimes'))
  const showPreciseFatigue = computed(() => flags.value.has('preciseFatigue'))
  const showCoach = computed(() => flags.value.has('coach'))

  // --- derived: content availability ----------------------------------------
  const tabs = computed(() => tabsFor(state.value))
  const sessions = computed(() => unlockedSessions(state.value))
  const gear = computed(() => availableGear(state.value))
  const lockedGearCount = computed(() => hiddenGear(state.value).length)
  const locations = computed(() => unlockedLocations(state.value))
  const milestones = computed(() =>
    MILESTONE_DEFS.map((m) => ({ ...m, earned: state.value.milestones.includes(m.id) })),
  )
  const raceResults = computed(() => [...state.value.raceResults].reverse())
  const pbs = computed(() => state.value.pbs)
  const vitalsHistory = computed(() => state.value.vitalsHistory)
  const events = computed(() => state.value.recentEvents)
  const raceDistances = computed(() =>
    RACE_DISTANCES.map((d) => ({ ...d, coverable: maxKm.value * 1000 >= d.metres })),
  )
  const tiers = computed(() => TIERS)

  // --- derived: helpers ------------------------------------------------------
  /** How many times has this session been performed? */
  function repetitionCount(sessionId) {
    return state.value.stats.sessionsByType[sessionId] ?? 0
  }

  /** Is fast/skip available for this session yet? */
  function fastAvailable(sessionId) {
    if (state.value.settings.fastMode) return true
    return (
      state.value.settings.autoFastMode &&
      repetitionCount(sessionId) >= PACING.fastModeUnlockRepeats
    )
  }

  /** Predicted time (seconds) for a distance — only meaningful with a GPS watch. */
  function predictedFor(distanceMetres) {
    return predictTime(state.value.vitals, distanceMetres, mods.value.racePaceMult)
  }

  /** All sessions incl. locked, for the picker's "coming up" hints. */
  const allSessions = computed(() =>
    SESSIONS.filter((s) => !s.rest).map((s) => ({
      ...s,
      unlocked: sessions.value.some((u) => u.id === s.id),
    })),
  )

  /** Clear the active session and re-drop it (used when a session is abandoned). */
  function abandonSession() {
    if (state.value.activeSession) dispatch({ type: 'CANCEL_SESSION' })
  }

  // --- race ------------------------------------------------------------------
  /**
   * Enter and resolve a race, staging the result for playback.
   * @param {{ distance: number, tier: string, pacing: string }} payload
   */
  function runRace(payload) {
    try {
      const result = dispatch({ type: 'RUN_RACE', payload })
      race.value = {
        distance: payload.distance,
        tier: payload.tier,
        pacing: payload.pacing,
        result: result.result,
        lane: result.lane,
      }
      return race.value
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
      return null
    }
  }

  function clearRace() {
    race.value = null
  }

  // --- settings / lifecycle --------------------------------------------------
  function setSettings(patch) {
    dispatch({ type: 'SET_SETTINGS', payload: patch })
  }

  function setLocation(locationId) {
    try {
      dispatch({ type: 'SET_LOCATION', payload: { locationId } })
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
    }
  }

  function buyGear(gearId) {
    try {
      dispatch({ type: 'BUY_GEAR', payload: { gearId } })
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
    }
  }

  function hardReset() {
    clearSave()
    state.value = createInitialState()
    celebrations.value = []
    lastSession.value = null
    race.value = null
    persist()
  }

  return {
    // state
    state,
    celebrations,
    lastSession,
    race,
    error,
    // actions
    dispatch,
    nextCelebration,
    clearLastSession,
    abandonSession,
    runRace,
    clearRace,
    setSettings,
    setLocation,
    buyGear,
    hardReset,
    // getters
    vitals,
    day,
    week,
    money,
    fatigue,
    maxKm,
    fitness,
    mods,
    flags,
    outcome,
    settings,
    location,
    showPredictedTimes,
    showPreciseFatigue,
    showCoach,
    tabs,
    sessions,
    allSessions,
    gear,
    lockedGearCount,
    locations,
    milestones,
    raceResults,
    pbs,
    vitalsHistory,
    events,
    raceDistances,
    tiers,
    // helpers
    repetitionCount,
    fastAvailable,
    predictedFor,
  }
})
