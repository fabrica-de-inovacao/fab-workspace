import { useQuery } from '@tanstack/react-query'
import { authClient } from '../lib/auth-client.js'

export type LinkedAccount = {
  id: string
  accountId: string
  providerId: string
  userId: string
  createdAt: Date
  updatedAt: Date
  scopes: string[]
}

export function useLinkedAccounts() {
  const query = useQuery({
    queryKey: ['linked-accounts'],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
    const result = await authClient.listAccounts()
      if (!Array.isArray(result) && 'error' in result && result.error) {
        throw new Error('Não foi possível carregar os acessos vinculados.')
      }
      return Array.isArray(result) ? result as LinkedAccount[] : 'data' in result ? result.data as LinkedAccount[] | null : null
    },
  })

  return {
    accounts: query.data ?? null,
    loading: query.isPending,
    error: query.error?.message ?? null,
    refresh: query.refetch,
  }
}
