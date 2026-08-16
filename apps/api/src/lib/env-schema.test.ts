import { describe, expect, it } from 'vitest'
import { parseEnv } from './env-schema.js'

const valid = {
  DATABASE_URL: 'postgres://user:password@localhost:5432/fab',
  BETTER_AUTH_SECRET: 'a'.repeat(32),
  GOOGLE_CLIENT_ID: 'client',
  GOOGLE_CLIENT_SECRET: 'secret',
}

describe('environment validation', () => {
  it('applies safe defaults', () => {
    expect(parseEnv(valid)).toMatchObject({ NODE_ENV: 'development', PORT: 3001, TRUST_PROXY: false })
  })

  it('reports invalid fields without exposing values', () => {
    expect(() => parseEnv({ ...valid, DATABASE_URL: 'https://wrong-db' })).toThrow('DATABASE_URL')
    expect(() => parseEnv({ ...valid, DATABASE_URL: 'https://wrong-db' })).not.toThrow('wrong-db')
  })
})
