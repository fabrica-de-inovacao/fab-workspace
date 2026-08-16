import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '@fabrica/db'
import { users as membersTable } from '@fabrica/db'
import {
  authUser,
  authSession,
  authAccount,
  authVerification,
} from '@fabrica/db'
import { eq } from 'drizzle-orm'
import { env } from '../env.js'

export const auth = betterAuth({
  // -------------------------------------------------------------------------
  // Base URL — Better Auth usa para montar callbacks e redirects
  // -------------------------------------------------------------------------
  baseURL: env.NODE_ENV === 'production'
    ? 'https://workspace.fabitz.com.br'
    : 'http://localhost:3001',

  basePath: '/api/auth',

  // -------------------------------------------------------------------------
  // Secret para assinar sessões
  // -------------------------------------------------------------------------
  secret: env.BETTER_AUTH_SECRET,

  // -------------------------------------------------------------------------
  // Adapter Drizzle — aponta para as tabelas better_auth_*
  // -------------------------------------------------------------------------
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: authUser,
      session: authSession,
      account: authAccount,
      verification: authVerification,
    },
  }),

  // -------------------------------------------------------------------------
  // Sessão via cookie httpOnly
  // -------------------------------------------------------------------------
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 7, // 7 dias
    },
  },

  // -------------------------------------------------------------------------
  // Credenciais — Email ou CPF no mesmo campo
  // -------------------------------------------------------------------------
  emailAndPassword: {
    enabled: true,
    // Desabilita sign-up público — admins são criados pelo sistema
    // (membros da fábrica não se auto-cadastram como admins)
    disableSignUp: false,
    // Hook que roda antes de autenticar — resolve CPF → email
    async authorize(credentials) {
      const raw = credentials.email as string
      const identifier = raw.replace(/[^\d\w@.+-]/g, '')
      const isCpf = !identifier.includes('@') && /^\d{11}$/.test(identifier)

      if (!isCpf) return null // deixa o Better Auth lidar normalmente

      // Busca o email real pelo CPF na tabela de membros
      const member = await db.query.users.findFirst({
        where: eq(membersTable.cpf, identifier),
      })

      if (!member) return null

      // Retorna o email para o Better Auth continuar o fluxo normal
      return { email: member.email }
    },
  },

  // -------------------------------------------------------------------------
  // Social — Google OAuth
  // -------------------------------------------------------------------------
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: env.GOOGLE_CLIENT_SECRET ?? '',
    },
  },

  // -------------------------------------------------------------------------
  // Trusted origins (CORS)
  // -------------------------------------------------------------------------
  trustedOrigins: [
    'http://localhost:5173',
    'https://workspace.fabitz.com.br',
  ],
})

export type Auth = typeof auth
