export type MikroTikParams = {
  mac: string
  ip: string
  linkLogin: string
  linkOrig: string
  error: string
  success: boolean
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
  }
}

export function isValidLoginUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}
