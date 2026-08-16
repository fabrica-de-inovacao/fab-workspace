import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import { requireAuth } from '../middleware/require-auth.js'
import { getUserHistory, listHistory, listOnline } from '../services/presence.service.js'

const jsonContent = (schema: z.ZodType) => ({ content: { 'application/json': { schema } } })
const errorSchema = z.object({ error: z.string() })
const pagination = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export const presenceRouter = new OpenAPIHono()
presenceRouter.use('/api/presence/*', requireAuth)

const onlineRoute = createRoute({
  method: 'get', path: '/api/presence/online', tags: ['Presence'], summary: 'Listar sessões Wi-Fi online',
  responses: { 200: { description: 'Sessões online', ...jsonContent(z.object({ data: z.array(z.any()) })) } },
})
presenceRouter.openapi(onlineRoute, async (c) => c.json({ data: await listOnline() }))

const historyQuery = pagination.extend({
  username: z.string().trim().optional(),
  from: z.iso.datetime().optional(),
  to: z.iso.datetime().optional(),
})
const historyRoute = createRoute({
  method: 'get', path: '/api/presence/history', tags: ['Presence'], summary: 'Consultar histórico Wi-Fi',
  request: { query: historyQuery },
  responses: {
    200: { description: 'Histórico paginado', ...jsonContent(z.any()) },
    400: { description: 'Filtros inválidos', ...jsonContent(errorSchema) },
  },
})
presenceRouter.openapi(historyRoute, async (c) => {
  const parsed = historyQuery.safeParse(c.req.query())
  if (!parsed.success) return c.json({ error: 'Filtros inválidos' }, 400)
  return c.json(await listHistory({
    page: parsed.data.page,
    limit: parsed.data.limit,
    ...(parsed.data.username && { username: parsed.data.username }),
    ...(parsed.data.from && { from: new Date(parsed.data.from) }),
    ...(parsed.data.to && { to: new Date(parsed.data.to) }),
  }))
})

const userHistoryRoute = createRoute({
  method: 'get', path: '/api/presence/history/{username}', tags: ['Presence'], summary: 'Histórico Wi-Fi de um membro',
  request: { params: z.object({ username: z.string().min(1) }), query: pagination },
  responses: {
    200: { description: 'Histórico do membro', ...jsonContent(z.any()) },
    400: { description: 'Paginação inválida', ...jsonContent(errorSchema) },
  },
})
presenceRouter.openapi(userHistoryRoute, async (c) => {
  const query = pagination.safeParse(c.req.query())
  if (!query.success) return c.json({ error: 'Paginação inválida' }, 400)
  return c.json(await getUserHistory(c.req.param('username'), query.data.page, query.data.limit))
})
