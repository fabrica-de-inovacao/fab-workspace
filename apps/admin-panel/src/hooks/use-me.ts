import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api.js'

export type CurrentUser = {
  id: string
  name: string
  email: string
  cpf?: string | null
  phone?: string | null
  active: boolean
  roles: string[]
}

export function useMe() {
  const query = useQuery({
    queryKey: ['me'],
    queryFn: () => api<{ data: CurrentUser }>('/me'),
    staleTime: 5 * 60 * 1000,
  })

  const roles = query.data?.data.roles ?? []
  const isAdmin = roles.includes('admin')
  const isCoordinator = roles.includes('coordenador') || isAdmin

  return {
    user: query.data?.data ?? null,
    roles,
    isAdmin,
    isCoordinator,
    isLoading: query.isLoading,
  }
}
