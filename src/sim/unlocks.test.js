import { describe, it, expect } from 'vitest'
import { createInitialState } from './state.js'
import {
  unlockedSessions,
  availableGear,
  tabsFor,
  earnedMilestones,
  newMilestones,
  unlockMet,
  isSessionUnlocked,
} from './unlocks.js'
import { resolve } from './actions.js'
import { resolveSession } from './training.js'
import { getGear } from '@/data/gear.js'

describe('unlocks', () => {
  it('starts with only the beginner sessions unlocked', () => {
    const s = createInitialState(1)
    const ids = unlockedSessions(s).map((x) => x.id)
    expect(ids).toContain('rest')
    expect(ids).toContain('runwalk')
    expect(ids).toContain('easy')
    expect(ids).toContain('recovery')
    expect(ids).not.toContain('long')
    expect(ids).not.toContain('intervals')
  })

  it('unlocks the long run once durability reaches the threshold', () => {
    let s = createInitialState(1)
    expect(isSessionUnlocked(s, 'long')).toBe(false)
    for (let i = 0; i < 20 && !isSessionUnlocked(s, 'long'); i++) {
      s = resolveSession(s, 'runwalk').state
    }
    expect(isSessionUnlocked(s, 'long')).toBe(true)
  })

  it('gates strides + drills behind the track-access flag', () => {
    let s = createInitialState(1)
    // Earn the track's milestone and enough money to buy it.
    s = { ...s, milestones: ['first_race'], money: 1000 }
    expect(unlockMet(s, getGear('track_access').unlock)).toBe(true)
    expect(isSessionUnlocked(s, 'strides')).toBe(false)
    s = resolve(s, { type: 'BUY_GEAR', payload: { gearId: 'track_access' } }).state
    expect(isSessionUnlocked(s, 'strides')).toBe(true)
    expect(isSessionUnlocked(s, 'drills')).toBe(true)
  })

  it('reveals tabs progressively', () => {
    const s = createInitialState(1)
    const tabs = tabsFor(s)
    expect(tabs.train).toBe(true)
    expect(tabs.race).toBe(true) // 2 km covers the 1 km race
    expect(tabs.shop).toBe(false) // no money yet, no races yet
    expect(tabs.journal).toBe(false) // no training log
  })

  it('shows the shop after the first race earnings', () => {
    let s = createInitialState(1)
    s = resolve(s, { type: 'RUN_RACE', payload: { distance: 1000, tier: 'local', pacing: 'even' } }).state
    expect(tabsFor(s).shop).toBe(true)
    expect(availableGear(s).length).toBeGreaterThan(0)
  })

  it('opens the journal once the training log is bought', () => {
    let s = createInitialState(1)
    s = resolve(s, { type: 'RUN_RACE', payload: { distance: 1000, tier: 'local', pacing: 'even' } }).state
    s = { ...s, money: 1000 }
    s = resolve(s, { type: 'BUY_GEAR', payload: { gearId: 'training_log' } }).state
    expect(tabsFor(s).journal).toBe(true)
  })

  it('earns distance milestones as max distance grows', () => {
    const s = createInitialState(1)
    const earned = earnedMilestones(s)
    expect(earned).toContain('first_2k')
    expect(earned).not.toContain('first_5k')
  })

  it('does not re-award an earned milestone', () => {
    let s = createInitialState(1)
    s = { ...s, milestones: ['first_2k', 'first_1k'] }
    expect(newMilestones(s)).not.toContain('first_2k')
    expect(newMilestones(s)).not.toContain('first_1k')
  })
})
