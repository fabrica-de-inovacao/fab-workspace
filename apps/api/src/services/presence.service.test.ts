import { describe, expect, it } from 'vitest'
import { durationFrom, PRESENCE_STALE_AFTER_MS, sessionStatus } from '../lib/duration.js'

describe('presence duration', () => {
  it('uses accounting duration when available', () => expect(durationFrom(new Date(0), 45, 100_000)).toBe(45))
  it('calculates active duration from start time', () => expect(durationFrom(new Date(10_000), null, 70_000)).toBe(60))
  it('marks a recently updated open session online', () => expect(sessionStatus(new Date(0), new Date(100_000), null, 100_000 + PRESENCE_STALE_AFTER_MS)).toBe('online'))
  it('marks an old open session stale', () => expect(sessionStatus(new Date(0), new Date(0), null, PRESENCE_STALE_AFTER_MS + 1)).toBe('stale'))
  it('marks stopped sessions ended', () => expect(sessionStatus(new Date(0), new Date(0), new Date(1), 1)).toBe('ended'))
})
