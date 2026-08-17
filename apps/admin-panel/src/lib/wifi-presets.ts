export const SPEED_PRESETS = [
  { label: 'Sem limite', value: '' },
  { label: 'Visitante — 5M/5M', value: '5M/5M' },
  { label: 'Padrão — 10M/10M', value: '10M/10M' },
  { label: 'Plus — 20M/20M', value: '20M/20M' },
  { label: 'Premium — 50M/50M', value: '50M/50M' },
  { label: 'Business — 100M/100M', value: '100M/100M' },
  { label: 'Personalizado', value: '__custom__' },
] as const

export const TIMEOUT_PRESETS = [
  { label: 'Sem limite', value: '' },
  { label: '1 hora', value: '3600' },
  { label: '4 horas', value: '14400' },
  { label: '8 horas', value: '28800' },
  { label: '12 horas', value: '43200' },
  { label: '1 dia', value: '86400' },
  { label: '3 dias', value: '259200' },
  { label: '7 dias', value: '604800' },
  { label: 'Personalizado', value: '__custom__' },
] as const

export function parseSpeedPreset(value: string | null): { preset: string; customDown: string; customUp: string } {
  if (!value) return { preset: '', customDown: '', customUp: '' }
  const match = value.match(/^(\d+)M\/(\d+)M$/)
  if (!match) return { preset: '__custom__', customDown: '', customUp: '' }
  const testVal = `${match[1]}M/${match[2]}M`
  const found = SPEED_PRESETS.find((p) => p.value === testVal)
  if (found && found.value !== '__custom__') return { preset: found.value, customDown: '', customUp: '' }
  return { preset: '__custom__', customDown: match[1] ?? '', customUp: match[2] ?? '' }
}

export function parseTimeoutPreset(seconds: number | null): { preset: string; customDays: string; customHours: string; customMinutes: string } {
  if (!seconds) return { preset: '', customDays: '', customHours: '', customMinutes: '' }
  const found = TIMEOUT_PRESETS.find((p) => p.value === String(seconds))
  if (found && found.value !== '__custom__') return { preset: found.value, customDays: '', customHours: '', customMinutes: '' }
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return { preset: '__custom__', customDays: days ? String(days) : '', customHours: hours ? String(hours) : '', customMinutes: minutes ? String(minutes) : '' }
}

export function buildSpeedValue(preset: string, customDown: string, customUp: string): string | null {
  if (preset === '__custom__') {
    const d = customDown.trim()
    const u = customUp.trim()
    if (!d && !u) return null
    return `${d || '0'}M/${u || '0'}M`
  }
  return preset || null
}

export function buildTimeoutValue(preset: string, customDays: string, customHours: string, customMinutes: string): number | null {
  if (preset === '__custom__') {
    const d = parseInt(customDays) || 0
    const h = parseInt(customHours) || 0
    const m = parseInt(customMinutes) || 0
    const total = d * 86400 + h * 3600 + m * 60
    return total > 0 ? total : null
  }
  return preset ? Number(preset) : null
}

export function formatTimeoutLong(seconds: number | null) {
  if (!seconds) return 'Sem limite'
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const parts: string[] = []
  if (days) parts.push(`${days}d`)
  if (hours) parts.push(`${hours}h`)
  if (minutes) parts.push(`${minutes}min`)
  return parts.join(' ') || `${seconds}s`
}
