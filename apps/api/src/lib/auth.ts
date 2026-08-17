import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '@fabrica/db'
import { users, sessions, accounts, verifications } from '@fabrica/db'
import { eq } from 'drizzle-orm'
import { env } from '../env.js'
import { AUTH_PATH } from './paths.js'

export const auth = betterAuth({
  // -------------------------------------------------------------------------
  // Base URL — Better Auth usa para montar callbacks e redirects
  // -------------------------------------------------------------------------
  baseURL: env.NODE_ENV === 'production'
    ? 'https://api.workspace.fabitz.com.br'
    : 'http://localhost:3001',

  basePath: AUTH_PATH,

  secret: env.BETTER_AUTH_SECRET,

  // -------------------------------------------------------------------------
  // Adapter Drizzle
  // -------------------------------------------------------------------------
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      users,
      sessions,
      accounts,
      verifications,
    },
  }),

  // -------------------------------------------------------------------------
  // Account linking — vínculo EXPLÍCITO apenas
  // disableImplicitLinking: Google com email existente → erro account_not_linked
  //   em vez de vincular silenciosamente. Força o usuário a ir em /profile.
  // -------------------------------------------------------------------------
  account: {
    modelName: 'accounts',
    accountLinking: {
      enabled: true,
      disableImplicitLinking: true,
      updateUserInfoOnLink: true,
    },
  },

  // -------------------------------------------------------------------------
  // Credenciais — Email ou CPF + sign-up público BLOQUEADO
  // -------------------------------------------------------------------------
  emailAndPassword: {
    enabled: true,
    disableSignUp: true, // contas só criadas por admin ou convite
    // Hook que resolve CPF → email antes do Better Auth autenticar
    async authorize(credentials: Record<string, unknown>) {
      const raw = credentials.email as string
      const identifier = raw.replace(/[^\d\w@.+-]/g, '')
      const isCpf = !identifier.includes('@') && /^\d{11}$/.test(identifier)

      if (!isCpf) return null // email normal — Better Auth lida sozinho

      const member = await db.query.users.findFirst({
        where: eq(users.cpf, identifier),
      })
      if (!member) return null

      return { email: member.email }
    },
  },

  user: {
    modelName: 'users',
    additionalFields: {
      cpf: {
        type: 'string',
        required: false,
        input: false,
      },
      phone: {
        type: 'string',
        required: false,
        input: false,
      },
      active: {
        type: 'boolean',
        required: true,
        defaultValue: true,
        input: false,
      },
    },
  },

  session: {
    modelName: 'sessions',
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 7,
    },
  },

  verification: {
    modelName: 'verifications',
  },

  // -------------------------------------------------------------------------
  // Social — Google OAuth
  // REGRAS:
  //   1. disableSignUp: true → Google nunca cria conta nova
  //   2. disableImplicitLinking (acima) → não vincula automaticamente
  //   3. Só entra quem já tem conta E já vinculou Google em /profile
  //   4. mapProfileToUser → importa foto e nome no momento do vínculo
  // -------------------------------------------------------------------------
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      disableSignUp: true, // bloqueia criação de conta nova via Google
      mapProfileToUser: (profile) => ({
        // Importa foto do Google — preenchida no vínculo, persiste nos logins
        image: profile.picture ?? null,
        // Sincroniza nome se vier do Google (only fills, não sobrescreve)
        name: profile.name ?? undefined,
      }),
    },
  },

  // -------------------------------------------------------------------------
  // Trusted origins (CORS)
  // -------------------------------------------------------------------------
  trustedOrigins: [
    'http://localhost:5173',
    'https://workspace.fabitz.com.br',
    'https://api.workspace.fabitz.com.br',
  ],
})

export type Auth = typeof auth
