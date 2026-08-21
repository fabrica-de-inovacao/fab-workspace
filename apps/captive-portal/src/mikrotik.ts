export type MikroTikParams = {
  mac: string
  ip: string
  username: string
  linkLogin: string
  linkOrig: string
  linkLogout: string
  uptime: string
  bytesIn: string
  bytesOut: string
  error: string
  errorOrig: string
  success: boolean
  allowedHosts: string[]
}

export function parseMikroTikParams(search: string): MikroTikParams {
  const params = new URLSearchParams(search)
  return {
    mac: params.get('mac') ?? '',
    ip: params.get('ip') ?? '',
    username: params.get('username') ?? params.get('user') ?? '',
    linkLogin: params.get('link-login') ?? '',
    linkOrig: params.get('link-orig') ?? '',
    linkLogout: params.get('link-logout') ?? '',
    uptime: params.get('uptime') ?? '',
    bytesIn: params.get('bytes-in') ?? '',
    bytesOut: params.get('bytes-out') ?? '',
    error: params.get('error') ?? '',
    errorOrig: params.get('error-orig') ?? '',
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
