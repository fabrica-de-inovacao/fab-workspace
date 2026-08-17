export type Role = {
  id: number
  name: string
  description: string | null
}

export type WifiProfile = {
  id: number
  name: string
  description: string | null
  wifiRateLimit: string | null
  wifiSessionTimeout: number | null
}

export type WifiProfileInput = {
  name: string
  description?: string | null
  wifiRateLimit?: string | null
  wifiSessionTimeout?: number | null
}

export type Member = {
  id: string
  name: string
  email: string
  cpf: string | null
  phone: string | null
  image: string | null
  wifiProfileId: number | null
  active: boolean
  createdAt: string
  userRoles: Array<{ roleId: number; role: Role }>
  wifiProfile: WifiProfile | null
}

export type MemberInput = {
  name: string
  email: string
  cpf?: string | null
  phone?: string | null
  roleId: number
  wifiProfileId?: number | null
}

export const API_PREFIX = '/api/v1'
export const API_ORIGIN = import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? ''

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_ORIGIN}${API_PREFIX}${path}`, {
    credentials: 'include',
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  const body = await response.json().catch(() => null) as T | { error?: string } | null
  if (!response.ok) {
    const message = body && typeof body === 'object' && 'error' in body && body.error
      ? body.error
      : 'Erro inesperado'
    throw new Error(message)
  }
  return body as T
}
