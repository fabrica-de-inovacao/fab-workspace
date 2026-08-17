import { vi } from 'vitest'

vi.hoisted(() => {
  process.env['DATABASE_URL'] = 'postgres://test:test@localhost:5432/test'
})

vi.mock('../lib/auth.js', () => ({
  auth: { api: { getSession: vi.fn().mockResolvedValue(null) } },
}))

import { OpenAPIHono } from '@hono/zod-openapi'
import { describe, expect, it } from 'vitest'
import { membersRouter } from './members.js'
import { presenceRouter } from './presence.js'

const app = new OpenAPIHono().route('/', membersRouter).route('/', presenceRouter)
const protectedRequests = [
  ['GET', '/api/v1/roles'],
  ['POST', '/api/v1/roles'],
  ['GET', '/api/v1/wifi-profiles'],
  ['POST', '/api/v1/wifi-profiles'],
  ['PATCH', '/api/v1/wifi-profiles/1'],
  ['DELETE', '/api/v1/wifi-profiles/1'],
  ['GET', '/api/v1/members'],
  ['POST', '/api/v1/members'],
  ['GET', '/api/v1/members/00000000-0000-0000-0000-000000000000'],
  ['PATCH', '/api/v1/members/00000000-0000-0000-0000-000000000000'],
  ['POST', '/api/v1/members/00000000-0000-0000-0000-000000000000/deactivate'],
  ['POST', '/api/v1/members/00000000-0000-0000-0000-000000000000/reactivate'],
  ['GET', '/api/v1/members/00000000-0000-0000-0000-000000000000/wifi-password'],
  ['POST', '/api/v1/members/00000000-0000-0000-0000-000000000000/reset-wifi-password'],
  ['GET', '/api/v1/presence/online'],
  ['GET', '/api/v1/presence/history'],
  ['GET', '/api/v1/presence/history/member@example.com'],
] as const

describe('protected API routes', () => {
  it.each(protectedRequests)('%s %s rejects an expired session', async (method, path) => {
    const response = await app.request(path, {
      method,
      headers: { cookie: 'better-auth.session_token=expired' },
    })

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'Não autenticado' })
  })
})
