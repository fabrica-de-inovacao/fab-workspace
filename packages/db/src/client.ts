import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema/index.js'

// DATABASE_URL deve ser injetada pelo app que importa este pacote
// (apps/api carrega .env via dotenv em src/env.ts antes de qualquer import)
if (!process.env['DATABASE_URL']) {
  throw new Error('DATABASE_URL is not set. Ensure dotenv is loaded before importing @fabrica/db.')
}

const pool = new Pool({
  connectionString: process.env['DATABASE_URL'],
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
})

export const db = drizzle(pool, { schema, logger: process.env['NODE_ENV'] === 'development' })

export async function closeDatabase() {
  await pool.end()
}

export type Database = typeof db
