import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

config({ path: '../../.env' })

if (!process.env['DATABASE_URL']) {
  throw new Error('DATABASE_URL is not set')
}

export default defineConfig({
  schema: './src/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  tablesFilter: [
    'users',
    'wifi_profiles',
    'roles',
    'user_roles',
    'invitations',
    'vouchers',
    'radcheck',
    'radreply',
    'radusergroup',
    'radacct',
    'radpostauth',
    'sessions',
    'accounts',
    'verifications',
  ],
  dbCredentials: {
    url: process.env['DATABASE_URL'],
  },
  verbose: true,
  strict: true,
})
