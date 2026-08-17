import './env.js' // valida env na startup — falha rápido se algo estiver errado
import { serve } from '@hono/node-server'
import { swaggerUI } from '@hono/swagger-ui'
import { OpenAPIHono } from '@hono/zod-openapi'
import { cors } from 'hono/cors'
import { getConnInfo } from '@hono/node-server/conninfo'
import { rateLimiter } from 'hono-rate-limiter'
import { env } from './env.js'
import { auth } from './lib/auth.js'
import { bootstrapRouter } from './routes/bootstrap.js'
import { invitationsRouter } from './routes/invitations.js'
import { membersRouter } from './routes/members.js'
import { presenceRouter } from './routes/presence.js'
import { closeDatabase, db, users } from '@fabrica/db'
import { eq, sql } from 'drizzle-orm'
import { securityHeaders } from './middleware/security.js'
import { API_PREFIX, AUTH_PATH, DOCS_PATH, OPENAPI_PATH } from './lib/paths.js'

const app = new OpenAPIHono()

app.use('*', securityHeaders)
app.use('*', async (c, next) => {
  const startedAt = Date.now()
  const requestId = crypto.randomUUID()
  c.header('X-Request-Id', requestId)
  await next()
  console.log(JSON.stringify({ requestId, method: c.req.method, path: c.req.path, status: c.res.status, durationMs: Date.now() - startedAt }))
})

// ---------------------------------------------------------------------------
// CORS — permite o admin-panel chamar a API
// ---------------------------------------------------------------------------
app.use('*', cors({
  origin: [
    'http://localhost:5173',
    'https://workspace.fabitz.com.br',
  ],
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true, // necessário para cookies de sessão
}))

const authRateLimit = rateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  keyGenerator: (c) => {
    if (env.TRUST_PROXY) {
      return c.req.header('cf-connecting-ip')
        ?? c.req.header('x-forwarded-for')?.split(',')[0]?.trim()
        ?? 'unknown'
    }
    return getConnInfo(c).remote.address ?? 'unknown'
  },
})

app.use(`${AUTH_PATH}/sign-in/*`, authRateLimit)
app.use(`${AUTH_PATH}/sign-up/*`, authRateLimit)
app.use(`${API_PREFIX}/bootstrap/admin`, authRateLimit)

// ---------------------------------------------------------------------------
// Better Auth — intercepta todo /api/v1/auth/**
// ---------------------------------------------------------------------------
app.post(`${AUTH_PATH}/sign-in/email`, async (c) => {
  const body = await c.req.json().catch(() => null) as { email?: unknown; password?: unknown } | null
  if (!body || typeof body.email !== 'string') return c.json({ error: 'Credenciais inválidas' }, 401)

  const identifier = body.email.trim()
  const cpf = identifier.replace(/\D/g, '')
  const user = cpf.length === 11 && !identifier.includes('@')
    ? await db.query.users.findFirst({ where: eq(users.cpf, cpf) })
    : await db.query.users.findFirst({ where: eq(users.email, identifier.toLowerCase()) })

  if (user && !user.active) return c.json({ error: 'Usuário inativo' }, 403)
  const authBody = { ...body, email: user?.email ?? identifier }
  const headers = new Headers(c.req.raw.headers)
  headers.delete('content-length')
  return auth.handler(new Request(c.req.raw.url, { method: 'POST', headers, body: JSON.stringify(authBody) }))
})
app.all(`${AUTH_PATH}/*`, (c) => auth.handler(c.req.raw))
app.route('/', bootstrapRouter)
app.route('/', invitationsRouter)
app.route('/', membersRouter)
app.route('/', presenceRouter)

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------
app.get('/health', async (c) => {
  try {
    await db.execute(sql`SELECT 1`)
    return c.json({ status: 'ok', db: 'connected' })
  } catch {
    return c.json({ status: 'error', db: 'disconnected' }, 503)
  }
})
app.get('/livez', (c) => c.json({ status: 'ok' }))
app.get('/readyz', async (c) => {
  try {
    await db.execute(sql`SELECT 1`)
    return c.json({ status: 'ok', db: 'connected' })
  } catch {
    return c.json({ status: 'error', db: 'disconnected' }, 503)
  }
})

// ---------------------------------------------------------------------------
// OpenAPI docs (Swagger UI — Sprint 2+)
// ---------------------------------------------------------------------------
app.doc(OPENAPI_PATH, {
  openapi: '3.0.0',
  info: { title: 'FAB Workspace API', version: '0.1.0' },
  servers: [
    { url: 'http://localhost:3001', description: 'Local' },
    { url: 'https://api.workspace.fabitz.com.br', description: 'Produção' },
  ],
})
app.get(DOCS_PATH, swaggerUI({ url: OPENAPI_PATH }))

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------
const server = serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`🚀 API running on http://localhost:${info.port}`)
  console.log(`🔐 Auth: http://localhost:${info.port}${AUTH_PATH}`)
  console.log(`📄 Swagger: http://localhost:${info.port}${DOCS_PATH}`)
})

async function shutdown(signal: string) {
  console.log(JSON.stringify({ event: 'shutdown', signal }))
  server.close(async () => {
    await closeDatabase()
    process.exit(0)
  })
  setTimeout(() => process.exit(1), 10_000).unref()
}

process.on('SIGTERM', () => { void shutdown('SIGTERM') })
process.on('SIGINT', () => { void shutdown('SIGINT') })
