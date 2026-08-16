import './env.js' // valida env na startup — falha rápido se algo estiver errado
import { serve } from '@hono/node-server'
import { OpenAPIHono } from '@hono/zod-openapi'
import { env } from './env.js'
import { db } from '@fabrica/db'
import { sql } from 'drizzle-orm'

const app = new OpenAPIHono()

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
  console.log(`📄 OpenAPI: http://localhost:${info.port}/openapi.json`)
})
