import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type Member, type MemberInput, type Role, type WifiProfile, type WifiProfileInput } from '../lib/api.js'

export type MemberFilters = { search?: string; page?: number; limit?: number; status?: 'active' | 'inactive'; roleId?: number; wifiProfileId?: number }

export function useMembers(filters: MemberFilters = {}) {
  const params = new URLSearchParams()
  if (filters.search) params.set('search', filters.search)
  if (filters.page) params.set('page', String(filters.page))
  if (filters.limit) params.set('limit', String(filters.limit))
  if (filters.status) params.set('status', filters.status)
  if (filters.roleId) params.set('roleId', String(filters.roleId))
  if (filters.wifiProfileId) params.set('wifiProfileId', String(filters.wifiProfileId))
  return useQuery({
    queryKey: ['members', filters],
    queryFn: () => api<{ data: Member[]; total: number; page: number; limit: number }>(`/members?${params}`),
  })
}

export function useMember(id: string) {
  return useQuery({
    queryKey: ['members', id],
    queryFn: () => api<{ data: Member }>(`/members/${id}`),
  })
}

export function useRoles() {
  return useQuery({ queryKey: ['roles'], queryFn: () => api<{ data: Role[] }>('/roles') })
}

export function useCreateRole() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: Omit<Role, 'id'>) => api<{ data: Role }>('/roles', {
      method: 'POST', body: JSON.stringify(input),
    }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['roles'] }),
  })
}

export function useWifiProfiles() {
  return useQuery({ queryKey: ['wifi-profiles'], queryFn: () => api<{ data: WifiProfile[] }>('/wifi-profiles') })
}

export function useCreateWifiProfile() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: WifiProfileInput) => api<{ data: WifiProfile }>('/wifi-profiles', {
      method: 'POST', body: JSON.stringify(input),
    }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['wifi-profiles'] }),
  })
}

export function useUpdateWifiProfile(id: number) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: Partial<WifiProfileInput>) => api<{ data: WifiProfile }>(`/wifi-profiles/${id}`, {
      method: 'PATCH', body: JSON.stringify(input),
    }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['wifi-profiles'] }),
  })
}

export function useDeleteWifiProfile() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api<{ success: boolean }>(`/wifi-profiles/${id}`, { method: 'DELETE' }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['wifi-profiles'] }),
  })
}

export type InvitationInput = {
  name: string
  email: string
  cpf?: string | null
  phone?: string | null
  roleId: number
  wifiProfileId?: number | null
  sendEmail?: boolean
}

export function useCreateInvitation() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: InvitationInput) => api<{ data: { invitation: unknown; inviteLink: string } }>('/invitations', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['members'] }),
  })
}

export function useCreateMember() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: MemberInput) => api<{ data: { user: Member; wifiPassword: string } }>('/members', {
      method: 'POST', body: JSON.stringify(input),
    }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['members'] }),
  })
}

export function useUpdateMember(id: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: Partial<MemberInput>) => api(`/members/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['members'] }),
  })
}

export function useMemberStatus(id: string, active: boolean) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: () => api<{ data: { active: boolean; wifiPassword?: string } }>(
      `/members/${id}/${active ? 'deactivate' : 'reactivate'}`,
      { method: 'POST' },
    ),
    onSuccess: () => client.invalidateQueries({ queryKey: ['members'] }),
  })
}

export function useWifiPassword(id: string) {
  return useQuery({
    queryKey: ['members', id, 'wifi-password'],
    queryFn: () => api<{ data: { password: string | null } }>(`/members/${id}/wifi-password`),
    enabled: false,
  })
}

export function useResetWifiPassword(id: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: () => api<{ data: { wifiPassword: string } }>(`/members/${id}/reset-wifi-password`, { method: 'POST' }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['members', id, 'wifi-password'] }),
  })
}
