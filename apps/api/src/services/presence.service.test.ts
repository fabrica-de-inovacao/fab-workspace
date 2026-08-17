import { describe, expect, it } from 'vitest'
import { durationFrom } from '../lib/duration.js'

describe('presence duration', () => {
  it('uses accounting duration when available', () => expect(durationFrom(new Date(0), 45, 100_000)).toBe(45))
  it('calculates active duration from start time', () => expect(durationFrom(new Date(10_000), null, 70_000)).toBe(60))
})
