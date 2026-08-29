import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import { requireCoordinator } from '../middleware/require-auth.js'
import { disconnectSession, getUserHistory, listHistory, listOnline } from '../services/presence.service.js'
import { API_PREFIX } from '../lib/paths.js'

const jsonContent = (schema: z.ZodType) => ({ content: { 'application/json': { schema } } })
const errorSchema = z.object({ error: z.string() })
const pagination = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export const presenceRouter = new OpenAPIHono()
presenceRouter.use(`${API_PREFIX}/presence/*`, requireCoordinator)

const onlineRoute = createRoute({
  method: 'get', path: `${API_PREFIX}/presence/online`, tags: ['Presence'], summary: 'Listar sessões Wi-Fi online',
  responses: { 200: { description: 'Sessões online', ...jsonContent(z.object({ data: z.array(z.any()) })) } },
})
presenceRouter.openapi(onlineRoute, async (c) => c.json({ data: await listOnline() }))

const disconnectRoute = createRoute({
  method: 'post', path: `${API_PREFIX}/presence/sessions/{id}/disconnect`, tags: ['Presence'], summary: 'Desconectar sessão Wi-Fi',
  request: { params: z.object({ id: z.string().regex(/^\d+$/) }) },
  responses: {
    200: { description: 'Desconexão solicitada', ...jsonContent(z.object({ data: z.object({ sessionId: z.string(), status: z.literal('disconnect_requested') }) })) },
    404: { description: 'Sessão não encontrada', ...jsonContent(errorSchema) },
    409: { description: 'Sessão já encerrada', ...jsonContent(errorSchema) },
    502: { description: 'MikroTik recusou a desconexão', ...jsonContent(errorSchema) },
    503: { description: 'CoA não configurado', ...jsonContent(errorSchema) },
    504: { description: 'MikroTik não respondeu', ...jsonContent(errorSchema) },
  },
})
presenceRouter.openapi(disconnectRoute, async (c) => {
  try {
    return c.json({ data: await disconnectSession(c.req.param('id')) }, 200)
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    if (message === 'SESSION_NOT_FOUND') return c.json({ error: 'Sessão não encontrada' }, 404)
    if (message === 'SESSION_NOT_ACTIVE') return c.json({ error: 'Sessão já encerrada' }, 409)
    if (message === 'RADIUS_COA_NOT_CONFIGURED') return c.json({ error: 'Desconexão RADIUS não configurada' }, 503)
    if (message === 'RADIUS_DISCONNECT_TIMEOUT') return c.json({ error: 'MikroTik não respondeu à desconexão' }, 504)
    if (message === 'RADIUS_DISCONNECT_NETWORK') return c.json({ error: 'Não foi possível alcançar o MikroTik' }, 502)
    if (message === 'RADIUS_DISCONNECT_REJECTED') return c.json({ error: 'MikroTik recusou a desconexão' }, 502)
    throw error
  }
})

const historyQuery = pagination.extend({
  username: z.string().trim().optional(),
  from: z.iso.datetime().optional(),
  to: z.iso.datetime().optional(),
})
const historyRoute = createRoute({
  method: 'get', path: `${API_PREFIX}/presence/history`, tags: ['Presence'], summary: 'Consultar histórico Wi-Fi',
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
  method: 'get', path: `${API_PREFIX}/presence/history/{username}`, tags: ['Presence'], summary: 'Histórico Wi-Fi de um membro',
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
