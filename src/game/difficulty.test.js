import { describe, it, expect } from 'vitest'
import { getDifficulty } from './difficulty.js'

describe('getDifficulty', () => {
  it('is neutral at score 0', () => {
    const d = getDifficulty(0)
    expect(d.speed).toBeCloseTo(1)
    expect(d.gap).toBeCloseTo(1)
    expect(d.spawn).toBeCloseTo(1)
  })
  it('ramps monotically: speed up, gap down', () => {
    const d1 = getDifficulty(10)
    const d2 = getDifficulty(50)
    expect(d2.speed).toBeGreaterThanOrEqual(d1.speed)
    expect(d2.gap).toBeLessThanOrEqual(d1.gap)
  })
})
