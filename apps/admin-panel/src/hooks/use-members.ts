import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type Member, type MemberInput, type Role } from '../lib/api.js'

export type MemberFilters = { search?: string; page?: number; limit?: number; status?: 'active' | 'inactive'; roleId?: number }

export function useMembers(filters: MemberFilters = {}) {
  const params = new URLSearchParams()
  if (filters.search) params.set('search', filters.search)
  if (filters.page) params.set('page', String(filters.page))
  if (filters.limit) params.set('limit', String(filters.limit))
  if (filters.status) params.set('status', filters.status)
  if (filters.roleId) params.set('roleId', String(filters.roleId))
  return useQuery({
    queryKey: ['members', filters],
    queryFn: () => api<{ data: Member[]; total: number; page: number; limit: number }>(`/api/members?${params}`),
  })
}

export function useMember(id: string) {
  return useQuery({
    queryKey: ['members', id],
    queryFn: () => api<{ data: Member }>(`/api/members/${id}`),
  })
}

export function useRoles() {
  return useQuery({ queryKey: ['roles'], queryFn: () => api<{ data: Role[] }>('/api/roles') })
}

export function useCreateRole() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: Omit<Role, 'id'>) => api<{ data: Role }>('/api/roles', {
      method: 'POST', body: JSON.stringify(input),
    }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['roles'] }),
  })
}

export function useCreateMember() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: MemberInput) => api<{ data: { user: Member; wifiPassword: string } }>('/api/members', {
      method: 'POST', body: JSON.stringify(input),
    }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['members'] }),
  })
}

export function useUpdateMember(id: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: Partial<MemberInput>) => api(`/api/members/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['members'] }),
  })
}

export function useMemberStatus(id: string, active: boolean) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: () => api<{ data: { active: boolean; wifiPassword?: string } }>(
      `/api/members/${id}/${active ? 'deactivate' : 'reactivate'}`,
      { method: 'POST' },
    ),
    onSuccess: () => client.invalidateQueries({ queryKey: ['members'] }),
  })
}

export function useWifiPassword(id: string) {
  return useQuery({
    queryKey: ['members', id, 'wifi-password'],
    queryFn: () => api<{ data: { password: string | null } }>(`/api/members/${id}/wifi-password`),
    enabled: false,
  })
}

export function useResetWifiPassword(id: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: () => api<{ data: { wifiPassword: string } }>(`/api/members/${id}/reset-wifi-password`, { method: 'POST' }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['members', id, 'wifi-password'] }),
  })
}
