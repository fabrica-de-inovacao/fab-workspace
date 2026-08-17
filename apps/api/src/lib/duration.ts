export function durationFrom(startedAt: Date | null, sessionSeconds: number | null, now = Date.now()) {
  if (sessionSeconds !== null) return sessionSeconds
  if (!startedAt) return 0
  return Math.max(0, Math.floor((now - startedAt.getTime()) / 1000))
}
