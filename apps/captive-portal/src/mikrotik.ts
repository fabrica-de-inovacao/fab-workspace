export type MikroTikParams = {
  mac: string
  ip: string
  linkLogin: string
  linkOrig: string
  error: string
  success: boolean
  allowedHosts: string[]
}

export function parseMikroTikParams(search: string): MikroTikParams {
  const params = new URLSearchParams(search)
  return {
    mac: params.get('mac') ?? '',
    ip: params.get('ip') ?? '',
    linkLogin: params.get('link-login') ?? '',
    linkOrig: params.get('link-orig') ?? '',
    error: params.get('error') ?? '',
    success: params.get('success') === 'true' || params.get('status') === 'connected',
    allowedHosts: String(params.get('allowed-hosts') ?? (import.meta.env as Record<string, string | undefined>)['VITE_MIKROTIK_LOGIN_HOSTS'] ?? '').split(',').map((host: string) => host.trim().toLowerCase()).filter(Boolean),
  }
}

export function isValidLoginUrl(value: string, allowedHosts: string[] = []) {
  try {
    const url = new URL(value)
    const protocolAllowed = url.protocol === 'http:' || url.protocol === 'https:'
    const hostAllowed = allowedHosts.length === 0 || allowedHosts.includes(url.host.toLowerCase()) || allowedHosts.includes(url.hostname.toLowerCase())
    return protocolAllowed && hostAllowed
  } catch {
    return false
  }
}
