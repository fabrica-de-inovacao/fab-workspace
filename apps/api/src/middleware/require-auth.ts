import type { MiddlewareHandler } from 'hono'
import { auth } from '../lib/auth.js'

export const requireAuth: MiddlewareHandler = async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  if (!session) return c.json({ error: 'Não autenticado' }, 401)
  c.set('session', session)
  await next()
}
