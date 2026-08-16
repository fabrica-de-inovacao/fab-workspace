/**
 * Tabelas gerenciadas pelo Better Auth.
 * NÃO editar estrutura — o Better Auth depende exatamente dessas colunas.
 * Geradas com base na documentação do better-auth v1.x + drizzleAdapter (PostgreSQL).
 */
import {
  pgTable,
  text,
  timestamp,
  boolean,
} from 'drizzle-orm/pg-core'

// ---------------------------------------------------------------------------
// better_auth_user — usuários autenticados no Admin Panel
// Separado da nossa tabela `users` (membros da fábrica).
// Um admin pode existir aqui sem ser membro, e vice-versa.
// ---------------------------------------------------------------------------
export const authUser = pgTable('better_auth_user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ---------------------------------------------------------------------------
// better_auth_session
// ---------------------------------------------------------------------------
export const authSession = pgTable('better_auth_session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => authUser.id, { onDelete: 'cascade' }),
})

// ---------------------------------------------------------------------------
// better_auth_account — vincula providers externos (Google) ao authUser
// ---------------------------------------------------------------------------
export const authAccount = pgTable('better_auth_account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => authUser.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'), // hash da senha para credentials provider
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ---------------------------------------------------------------------------
// better_auth_verification — tokens de verificação de email, reset de senha
// ---------------------------------------------------------------------------
export const authVerification = pgTable('better_auth_verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
