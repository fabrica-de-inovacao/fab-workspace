export function durationFrom(startedAt: Date | null, sessionSeconds: number | null, now = Date.now()) {
  if (sessionSeconds !== null) return sessionSeconds
  if (!startedAt) return 0
  return Math.max(0, Math.floor((now - startedAt.getTime()) / 1000))
}

export type PresenceStatus = 'online' | 'stale' | 'ended'

export const PRESENCE_STALE_AFTER_MS = 15 * 60 * 1000

export function sessionStatus(
  startedAt: Date | null,
  updatedAt: Date | null,
  stoppedAt: Date | null,
  now = Date.now(),
): PresenceStatus {
  if (stoppedAt) return 'ended'
  const lastSeenAt = updatedAt ?? startedAt
  if (!lastSeenAt || now - lastSeenAt.getTime() > PRESENCE_STALE_AFTER_MS) return 'stale'
  return 'online'
}
