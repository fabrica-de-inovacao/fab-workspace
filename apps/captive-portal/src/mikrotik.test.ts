import { describe, expect, it } from 'vitest'
import { isValidLoginUrl, parseMikroTikParams } from './mikrotik.js'

describe('MikroTik parameters', () => {
  it('maps RouterOS query parameters', () => {
    expect(parseMikroTikParams('?mac=AA%3ABB&ip=10.0.0.2&link-login=https%3A%2F%2Frouter%2Flogin&link-orig=https%3A%2F%2Fexample.com&error=invalid')).toEqual({
      mac: 'AA:BB', ip: '10.0.0.2', linkLogin: 'https://router/login', linkOrig: 'https://example.com', error: 'invalid', success: false,
    })
  })

  it('allows only HTTP login targets', () => {
    expect(isValidLoginUrl('https://router/login')).toBe(true)
    expect(isValidLoginUrl('javascript:alert(1)')).toBe(false)
    expect(isValidLoginUrl('')).toBe(false)
  })
})
