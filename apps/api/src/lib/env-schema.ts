import { z } from 'zod'

const booleanString = z.enum(['true', 'false']).default('false').transform((value) => value === 'true')

export const envSchema = z.object({
  DATABASE_URL: z.string().regex(/^postgres(?:ql)?:\/\//, 'DATABASE_URL must be a PostgreSQL URL'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65_535).default(3001),
  RADIUS_COA_SECRET: z.string().trim().min(16).optional(),
  RADIUS_COA_PORT: z.coerce.number().int().min(1).max(65_535).default(3799),
  BETTER_AUTH_SECRET: z.string().min(32, 'BETTER_AUTH_SECRET must be at least 32 chars'),
  GOOGLE_CLIENT_ID: z.string().min(1, 'GOOGLE_CLIENT_ID is required'),
  GOOGLE_CLIENT_SECRET: z.string().min(1, 'GOOGLE_CLIENT_SECRET is required'),
  TRUST_PROXY: booleanString,
  RESEND_API_KEY: z.string().trim().optional(),
  APP_URL: z.string().url().default('http://localhost:5173'),
})

export function parseEnv(values: Record<string, string | undefined>) {
  const parsed = envSchema.safeParse(values)
  if (parsed.success) return parsed.data

  const details = Object.entries(parsed.error.flatten().fieldErrors)
    .map(([field, errors]) => `${field}: ${errors?.join(', ')}`)
    .join('\n')
  throw new Error(`Invalid environment variables:\n${details}`)
}
