import { useEffect, useState } from 'react'
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
  const [accounts, setAccounts] = useState<LinkedAccount[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function refresh() {
    setLoading(true)
    const result = await authClient.listAccounts()
    setAccounts(Array.isArray(result) ? (result as LinkedAccount[]) : 'data' in result ? (result.data as LinkedAccount[] | null) : null)
    setError(!Array.isArray(result) && 'error' in result && result.error ? 'Não foi possível carregar os acessos vinculados.' : null)
    setLoading(false)
  }

  useEffect(() => {
    void refresh()
  }, [])

  return { accounts, loading, error, refresh }
}
