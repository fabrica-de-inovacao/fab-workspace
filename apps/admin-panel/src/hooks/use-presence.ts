import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api.js'

export type PresenceSession = {
  id: string
  username: string
  name: string | null
  image: string | null
  ip: string | null
  mac: string | null
  startedAt: string | null
  updatedAt: string | null
  lastSeenAt: string | null
  stoppedAt: string | null
  status: 'online' | 'stale' | 'ended'
  durationSeconds: number | null
  inputBytes: string | null
  outputBytes: string | null
  terminateCause: string | null
}

export type HistoryFilters = { page?: number; limit?: number; username?: string; from?: string; to?: string }

export function useOnlinePresence() {
  return useQuery({
    queryKey: ['presence', 'online'],
    queryFn: () => api<{ data: PresenceSession[] }>('/presence/online'),
    refetchInterval: 30_000,
  })
}

export function usePresenceHistory(filters: HistoryFilters, enabled = true) {
  const params = new URLSearchParams()
  if (filters.page) params.set('page', String(filters.page))
  if (filters.limit) params.set('limit', String(filters.limit))
  if (filters.username) params.set('username', filters.username)
  if (filters.from) params.set('from', new Date(`${filters.from}T00:00:00`).toISOString())
  if (filters.to) params.set('to', new Date(`${filters.to}T23:59:59`).toISOString())
  return useQuery({
    queryKey: ['presence', 'history', filters],
    queryFn: () => api<{ data: PresenceSession[]; total: number; page: number; limit: number }>(`/presence/history?${params}`),
    enabled,
    placeholderData: keepPreviousData,
  })
}

export function useDisconnectPresenceSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api<{ data: { sessionId: string; status: 'disconnect_requested' } }>(`/presence/sessions/${encodeURIComponent(id)}/disconnect`, { method: 'POST' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['presence'] })
      void queryClient.invalidateQueries({ queryKey: ['members'] })
    },
  })
}
