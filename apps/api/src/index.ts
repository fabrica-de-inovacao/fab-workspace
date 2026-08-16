import './env.js' // valida env na startup — falha rápido se algo estiver errado
import { serve } from '@hono/node-server'
import { OpenAPIHono } from '@hono/zod-openapi'
import { cors } from 'hono/cors'
import { getConnInfo } from '@hono/node-server/conninfo'
import { rateLimiter } from 'hono-rate-limiter'
import { env } from './env.js'
import { auth } from './lib/auth.js'
import { bootstrapRouter } from './routes/bootstrap.js'
import { membersRouter } from './routes/members.js'
import { presenceRouter } from './routes/presence.js'
import { db } from '@fabrica/db'
import { sql } from 'drizzle-orm'
import { securityHeaders } from './middleware/security.js'

const app = new OpenAPIHono()

app.use('*', securityHeaders)

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

app.use('/api/auth/sign-in/*', authRateLimit)
app.use('/api/auth/sign-up/*', authRateLimit)
app.use('/api/bootstrap/admin', authRateLimit)

// ---------------------------------------------------------------------------
// Better Auth — intercepta todo /api/auth/**
// ---------------------------------------------------------------------------
app.on(['GET', 'POST'], '/api/auth/**', (c) => auth.handler(c.req.raw))
app.route('/', bootstrapRouter)
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

// ---------------------------------------------------------------------------
// OpenAPI docs (Swagger UI — Sprint 2+)
// ---------------------------------------------------------------------------
app.doc('/openapi.json', {
  openapi: '3.0.0',
  info: { title: 'FAB Workspace API', version: '0.1.0' },
})

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------
serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`🚀 API running on http://localhost:${info.port}`)
  console.log(`🔐 Auth: http://localhost:${info.port}/api/auth`)
  console.log(`📄 OpenAPI: http://localhost:${info.port}/openapi.json`)
})
