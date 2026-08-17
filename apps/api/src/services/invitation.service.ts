import { randomBytes, randomUUID } from 'node:crypto'
import { hashPassword } from 'better-auth/crypto'
import {
  accounts,
  db,
  invitations,
  radcheck,
  radreply,
  roles,
  userRoles,
  users,
  wifiProfiles,
} from '@fabrica/db'
import { and, eq, gte, isNull } from 'drizzle-orm'
import { env } from '../env.js'
import { sendInvitationEmail } from './email.service.js'

const WIFI_PASSWORD_BYTES = 12

export type CreateInvitationInput = {
  name: string
  email: string
  cpf?: string | null | undefined
  phone?: string | null | undefined
  roleId: number
  wifiProfileId?: number | null | undefined
  sendEmail?: boolean | undefined
}

export type AcceptInvitationInput = {
  token: string
  password: string
}

function createWifiPassword() {
  return randomBytes(WIFI_PASSWORD_BYTES).toString('base64url')
}

export async function createInvitation(input: CreateInvitationInput) {
  const token = randomBytes(24).toString('hex')
  const id = randomUUID()
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 horas

  const [invitation] = await db.insert(invitations).values({
    id,
    token,
    name: input.name,
    email: input.email.toLowerCase(),
    cpf: input.cpf ?? null,
    phone: input.phone ?? null,
    roleId: input.roleId,
    wifiProfileId: input.wifiProfileId ?? null,
    expiresAt,
  }).returning()

  if (!invitation) throw new Error('INVITATION_CREATE_FAILED')

  const inviteLink = `${env.APP_URL}/login?inviteToken=${token}`

  if (input.sendEmail !== false) {
    await sendInvitationEmail({
      to: invitation.email,
      name: invitation.name,
      inviteLink,
    })
  }

  return { invitation, inviteLink }
}

export async function verifyInvitation(token: string) {
  const invitation = await db.query.invitations.findFirst({
    where: and(
      eq(invitations.token, token),
      isNull(invitations.acceptedAt),
      gte(invitations.expiresAt, new Date()),
    ),
  })
  if (!invitation) throw new Error('INVITATION_INVALID')
  return invitation
}

export async function acceptInvitation(input: AcceptInvitationInput) {
  const invitation = await verifyInvitation(input.token)
  const userId = randomUUID()
  const accountId = randomUUID()
  const passwordHash = await hashPassword(input.password)

  return db.transaction(async (tx) => {
    // 1. Criar usuário
    const [user] = await tx.insert(users).values({
      id: userId,
      name: invitation.name,
      email: invitation.email,
      emailVerified: true,
      cpf: invitation.cpf ?? null,
      phone: invitation.phone ?? null,
      wifiProfileId: invitation.wifiProfileId ?? null,
      active: true,
    }).returning()

    if (!user) throw new Error('USER_CREATE_FAILED')

    // 2. Criar conta de login com senha no Better Auth
    await tx.insert(accounts).values({
      id: accountId,
      accountId: userId,
      providerId: 'credential',
      userId,
      password: passwordHash,
    })

    // 3. Atribuir perfil de acesso ao sistema
    await tx.insert(userRoles).values({
      userId,
      roleId: invitation.roleId,
    })

    // 4. Provisionar Wi-Fi RADIUS com a MESMA senha do Painel (Senha Única)
    await tx.insert(radcheck).values({
      username: user.email,
      attribute: 'Cleartext-Password',
      op: ':=',
      value: input.password,
    })

    if (invitation.wifiProfileId) {
      const wifiProfile = await tx.query.wifiProfiles.findFirst({ where: eq(wifiProfiles.id, invitation.wifiProfileId) })
      if (wifiProfile) {
        const attributes = []
        if (wifiProfile.wifiRateLimit) {
          attributes.push({ username: user.email, attribute: 'Mikrotik-Rate-Limit', op: '=', value: wifiProfile.wifiRateLimit })
        }
        if (wifiProfile.wifiSessionTimeout) {
          attributes.push({ username: user.email, attribute: 'Session-Timeout', op: '=', value: String(wifiProfile.wifiSessionTimeout) })
        }
        if (attributes.length) await tx.insert(radreply).values(attributes)
      }
    }

    // 5. Marcar convite como aceito
    await tx.update(invitations).set({ acceptedAt: new Date() }).where(eq(invitations.id, invitation.id))

    return { user }
  })
}
