import { describe, it, expect } from 'vitest'
import { fmtTime, fmtPace, paceOf, fmtPaceOf, ordinal, fmtDistance } from './format.js'

describe('format helpers', () => {
  it('formats times as m:ss and h:mm:ss', () => {
    expect(fmtTime(0)).toBe('0:00')
    expect(fmtTime(65)).toBe('1:05')
    expect(fmtTime(600)).toBe('10:00')
    expect(fmtTime(3661)).toBe('1:01:01')
  })

  it('converts a performance into per-km pace', () => {
    // 13:48 for 2 km -> 6:54 /km
    expect(Math.round(paceOf(828, 2000))).toBe(414)
    expect(fmtPaceOf(828, 2000)).toBe('6:54 /km')
  })

  it('formats pace strings', () => {
    expect(fmtPace(272)).toBe('4:32 /km')
  })

  it('handles zero distance without dividing by zero', () => {
    expect(paceOf(100, 0)).toBe(0)
  })

  it('produces ordinals', () => {
    expect(ordinal(1)).toBe('1st')
    expect(ordinal(2)).toBe('2nd')
    expect(ordinal(3)).toBe('3rd')
    expect(ordinal(11)).toBe('11th')
    expect(ordinal(22)).toBe('22nd')
  })

  it('formats distances', () => {
    expect(fmtDistance(5000)).toBe('5 km')
    expect(fmtDistance(400)).toBe('400 m')
  })
})
