import { config } from 'dotenv'
import { resolve } from 'node:path'
import { z } from 'zod'

// Carrega .env da raiz do monorepo (../../.env relativo a apps/api)
config({ path: resolve(import.meta.dirname, '../../..', '.env') })

const envSchema = z.object({
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid postgres URL'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  // Preenchido na Sprint 1 (Better Auth)
  BETTER_AUTH_SECRET: z.string().min(32).optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('❌ Invalid environment variables:')
  console.error(parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsed.data
