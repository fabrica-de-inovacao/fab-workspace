import { config } from 'dotenv'
import { resolve } from 'node:path'
import { parseEnv } from './lib/env-schema.js'

// Carrega .env da raiz do monorepo (../../.env relativo a apps/api)
config({ path: resolve(import.meta.dirname, '../../..', '.env') })

export const env = parseEnv(process.env)
