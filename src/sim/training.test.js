import { describe, it, expect } from 'vitest'
import { createInitialState } from './state.js'
import { resolveSession } from './training.js'
import { resolve } from './actions.js'
import { maxDistanceKm } from './vitals.js'
import { FATIGUE } from '@/data/balance.js'

describe('session resolution', () => {
  it('advances the calendar one day per session', () => {
    const s0 = createInitialState(1)
    const { state } = resolveSession(s0, 'easy')
    expect(state.day).toBe(s0.day + 1)
    expect(state.stats.sessionsCompleted).toBe(1)
  })

  it('raises the targeted vital', () => {
    const s0 = createInitialState(1)
    const { state } = resolveSession(s0, 'easy')
    expect(state.vitals.efficiency).toBeGreaterThan(s0.vitals.efficiency)
  })

  it('scales gains DOWN with fatigue (the tension valve)', () => {
    const fresh = { ...createInitialState(1), fatigue: 0 }
    const wrecked = { ...createInitialState(1), fatigue: 95 }

    const gainFresh = resolveSession(fresh, 'easy').state.vitals.efficiency - fresh.vitals.efficiency
    const gainWrecked = resolveSession(wrecked, 'easy').state.vitals.efficiency - wrecked.vitals.efficiency

    expect(gainFresh).toBeGreaterThan(gainWrecked)
    // Fully fatigued should still earn something, but near the floor (20%).
    expect(gainWrecked).toBeGreaterThan(0)
    expect(gainWrecked / gainFresh).toBeLessThanOrEqual(0.25)
  })

  it('rest recovers more fatigue than a recovery run', () => {
    const tired = { ...createInitialState(1), fatigue: 50 }
    const rested = resolveSession(tired, 'rest')
    const recov = resolveSession(tired, 'recovery')
    expect(rested.state.fatigue).toBe(50 - FATIGUE.restRecovery)
    expect(rested.state.fatigue).toBeLessThan(recov.state.fatigue)
  })

  it('a recovery run still earns a sliver of aerobic progress', () => {
    const s0 = { ...createInitialState(1), fatigue: 40 }
    const { state } = resolveSession(s0, 'recovery')
    expect(state.vitals.efficiency).toBeGreaterThan(s0.vitals.efficiency)
  })

  it('cannot resolve a locked session', () => {
    const s0 = createInitialState(1)
    expect(() => resolveSession(s0, 'intervals')).toThrow(/locked/i)
  })

  it('extends max distance via durability + efficiency', () => {
    const s0 = createInitialState(1)
    let s = s0
    for (let i = 0; i < 10; i++) s = resolveSession(s, 'runwalk').state
    expect(maxDistanceKm(s.vitals)).toBeGreaterThan(maxDistanceKm(s0.vitals))
  })

  it('records milestone events once', () => {
    const s0 = createInitialState(1)
    const { state, events } = resolveSession(s0, 'easy')
    const milestoneEvents = events.filter((e) => e.kind === 'milestone')
    expect(milestoneEvents.length).toBeGreaterThan(0)
    // Re-resolving should not re-award them.
    const { events: again } = resolveSession(state, 'easy')
    expect(again.filter((e) => e.kind === 'milestone')).toHaveLength(0)
  })
})

describe('action dispatcher', () => {
  it('START_SESSION then RESOLVE_SESSION resolves and clears', () => {
    let s = resolve(createInitialState(1), { type: 'START_SESSION', payload: { sessionId: 'easy' } }).state
    expect(s.activeSession?.sessionId).toBe('easy')
    s = resolve(s, { type: 'RESOLVE_SESSION' }).state
    expect(s.activeSession).toBeNull()
    expect(s.stats.sessionsCompleted).toBe(1)
  })

  it('does not mutate the previous state', () => {
    const s0 = createInitialState(1)
    const frozen = JSON.stringify(s0)
    resolveSession(s0, 'easy')
    expect(JSON.stringify(s0)).toBe(frozen)
  })
})
