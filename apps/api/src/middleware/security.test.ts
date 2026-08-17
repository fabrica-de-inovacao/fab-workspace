import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'
import { securityHeaders } from './security.js'

describe('security headers', () => {
  it('adds browser hardening headers', async () => {
    const app = new Hono().use('*', securityHeaders).get('/', (c) => c.text('ok'))
    const response = await app.request('/')

    expect(response.headers.get('x-content-type-options')).toBe('nosniff')
    expect(response.headers.get('x-frame-options')).toBe('SAMEORIGIN')
    expect(response.headers.get('referrer-policy')).toBe('strict-origin-when-cross-origin')
  })
})
