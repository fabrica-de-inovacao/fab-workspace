// Re-exports públicos do pacote @fabrica/db
export { db } from './client.js'
export type { Database } from './client.js'

// Schemas
export * from './schema/index.js'

// Tipos inferidos — usados pelo @fabrica/types
export type {
  InferSelectModel,
  InferInsertModel,
} from 'drizzle-orm'
