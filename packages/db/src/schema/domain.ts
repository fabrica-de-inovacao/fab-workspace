import {
  pgTable,
  serial,
  varchar,
  boolean,
  timestamp,
  text,
  primaryKey,
  integer,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ---------------------------------------------------------------------------
// wifiProfiles — Perfis de Rede / Wi-Fi (regras RADIUS/MikroTik)
// ---------------------------------------------------------------------------
export const wifiProfiles = pgTable('wifi_profiles', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 64 }).notNull().unique(), // ex: 'Padrão 20M', 'Visitante 5M'
  description: text('description'),
  wifiRateLimit: varchar('wifi_rate_limit', { length: 32 }), // ex: '20M/20M'
  wifiSessionTimeout: integer('wifi_session_timeout'), // em segundos (null = ilimitado)
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// ---------------------------------------------------------------------------
// users — Membros da Fábrica
// ---------------------------------------------------------------------------
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  cpf: varchar('cpf', { length: 11 }).unique(), // apenas dígitos, sem pontuação
  phone: varchar('phone', { length: 20 }),
  wifiProfileId: integer('wifi_profile_id').references(() => wifiProfiles.id, { onDelete: 'set null' }),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ---------------------------------------------------------------------------
// roles — Perfis de Acesso ao Sistema (permissões do painel: 'admin', 'member')
// ---------------------------------------------------------------------------
export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 64 }).notNull().unique(), // ex: 'admin', 'member'
  description: text('description'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// ---------------------------------------------------------------------------
// user_roles (N:N pivot para perfis de acesso ao sistema)
// ---------------------------------------------------------------------------
export const userRoles = pgTable(
  'user_roles',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    roleId: integer('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'restrict' }),
    assignedAt: timestamp('assigned_at').notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.roleId] })],
)

// ---------------------------------------------------------------------------
// invitations — Convites para cadastro de novos membros
// ---------------------------------------------------------------------------
export const invitations = pgTable('invitations', {
  id: text('id').primaryKey(),
  token: text('token').notNull().unique(),
  email: text('email').notNull(),
  name: text('name').notNull(),
  cpf: varchar('cpf', { length: 11 }),
  phone: varchar('phone', { length: 20 }),
  roleId: integer('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  wifiProfileId: integer('wifi_profile_id').references(() => wifiProfiles.id, { onDelete: 'set null' }),
  expiresAt: timestamp('expires_at').notNull(),
  acceptedAt: timestamp('accepted_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------
export const wifiProfilesRelations = relations(wifiProfiles, ({ many }) => ({
  users: many(users),
}))

export const usersRelations = relations(users, ({ one, many }) => ({
  userRoles: many(userRoles),
  wifiProfile: one(wifiProfiles, { fields: [users.wifiProfileId], references: [wifiProfiles.id] }),
}))

export const rolesRelations = relations(roles, ({ many }) => ({
  userRoles: many(userRoles),
}))

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, { fields: [userRoles.userId], references: [users.id] }),
  role: one(roles, { fields: [userRoles.roleId], references: [roles.id] }),
}))
