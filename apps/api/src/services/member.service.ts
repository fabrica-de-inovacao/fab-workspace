import { randomBytes, randomUUID } from 'node:crypto'
import {
  db,
  radcheck,
  radreply,
  roles,
  sessions,
  userRoles,
  users,
  wifiProfiles,
} from '@fabrica/db'
import { and, asc, count, desc, eq, ilike, inArray, or } from 'drizzle-orm'
import { ACCT_INTERIM_INTERVAL_SECONDS } from '../lib/radius.js'

const WIFI_PASSWORD_BYTES = 12

export type CreateMemberInput = {
  name: string
  email: string
  cpf?: string | null | undefined
  phone?: string | null | undefined
  roleId: number
  wifiProfileId?: number | null | undefined
}

export type UpdateMemberInput = {
  name?: string | undefined
  email?: string | undefined
  cpf?: string | null | undefined
  phone?: string | null | undefined
  roleId?: number | undefined
  wifiProfileId?: number | null | undefined
}

export type ListMembersInput = {
  page: number
  limit: number
  search?: string
  active?: boolean
  roleId?: number
  wifiProfileId?: number
}

export type WifiProfileInput = {
  name: string
  description?: string | null | undefined
  wifiRateLimit?: string | null | undefined
  wifiSessionTimeout?: number | null | undefined
}

function createWifiPassword() {
  return randomBytes(WIFI_PASSWORD_BYTES).toString('base64url')
}

async function getRole(tx: Parameters<Parameters<typeof db.transaction>[0]>[0], roleId: number) {
  const role = await tx.query.roles.findFirst({ where: eq(roles.id, roleId) })
  if (!role) throw new Error('ROLE_NOT_FOUND')
  return role
}

async function getWifiProfile(tx: Parameters<Parameters<typeof db.transaction>[0]>[0], wifiProfileId: number) {
  const profile = await tx.query.wifiProfiles.findFirst({ where: eq(wifiProfiles.id, wifiProfileId) })
  if (!profile) throw new Error('WIFI_PROFILE_NOT_FOUND')
  return profile
}

async function writeRadiusReply(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  username: string,
  wifiProfile: typeof wifiProfiles.$inferSelect | null,
) {
  const attributes = [{ username, attribute: 'Acct-Interim-Interval', op: ':=', value: ACCT_INTERIM_INTERVAL_SECONDS }]
  if (wifiProfile?.wifiRateLimit) {
    attributes.push({ username, attribute: 'Mikrotik-Rate-Limit', op: '=', value: wifiProfile.wifiRateLimit })
  }
  if (wifiProfile?.wifiSessionTimeout) {
    attributes.push({ username, attribute: 'Session-Timeout', op: '=', value: String(wifiProfile.wifiSessionTimeout) })
  }
  await tx.insert(radreply).values(attributes)
}

// ---------------------------------------------------------------------------
// Perfis de Rede Wi-Fi (CRUD)
// ---------------------------------------------------------------------------
export async function listWifiProfiles() {
  return db.select().from(wifiProfiles).orderBy(asc(wifiProfiles.name))
}

export async function createWifiProfile(input: WifiProfileInput) {
  const [profile] = await db.insert(wifiProfiles).values({
    name: input.name,
    description: input.description ?? null,
    wifiRateLimit: input.wifiRateLimit ?? null,
    wifiSessionTimeout: input.wifiSessionTimeout ?? null,
  }).returning()
  return profile
}

export async function updateWifiProfile(id: number, input: Partial<WifiProfileInput>) {
  const [profile] = await db.update(wifiProfiles).set({
    ...(input.name !== undefined && { name: input.name }),
    ...(input.description !== undefined && { description: input.description }),
    ...(input.wifiRateLimit !== undefined && { wifiRateLimit: input.wifiRateLimit }),
    ...(input.wifiSessionTimeout !== undefined && { wifiSessionTimeout: input.wifiSessionTimeout }),
  }).where(eq(wifiProfiles.id, id)).returning()
  return profile
}

export async function deleteWifiProfile(id: number) {
  await db.delete(wifiProfiles).where(eq(wifiProfiles.id, id))
}

// ---------------------------------------------------------------------------
// Membros (CRUD)
// ---------------------------------------------------------------------------
export async function createMember(input: CreateMemberInput) {
  const wifiPassword = createWifiPassword()

  return db.transaction(async (tx) => {
    const role = await getRole(tx, input.roleId)
    const wifiProfile = input.wifiProfileId ? await getWifiProfile(tx, input.wifiProfileId) : null

    const [user] = await tx.insert(users).values({
      id: randomUUID(),
      name: input.name,
      email: input.email.toLowerCase(),
      cpf: input.cpf ?? null,
      phone: input.phone ?? null,
      wifiProfileId: wifiProfile?.id ?? null,
      active: true,
    }).returning()

    if (!user) throw new Error('USER_CREATE_FAILED')

    await tx.insert(userRoles).values({ userId: user.id, roleId: role.id })
    await tx.insert(radcheck).values({
      username: user.email,
      attribute: 'Cleartext-Password',
      op: ':=',
      value: wifiPassword,
    })
    await writeRadiusReply(tx, user.email, wifiProfile)

    return { user, role, wifiProfile, wifiPassword }
  })
}

export async function listMembers(input: ListMembersInput) {
  const filters = []
  if (input.active !== undefined) filters.push(eq(users.active, input.active))
  if (input.search) {
    const search = `%${input.search}%`
    filters.push(or(ilike(users.name, search), ilike(users.email, search)))
  }
  if (input.roleId) {
    const ids = db.select({ userId: userRoles.userId }).from(userRoles).where(eq(userRoles.roleId, input.roleId))
    filters.push(inArray(users.id, ids))
  }
  if (input.wifiProfileId) {
    filters.push(eq(users.wifiProfileId, input.wifiProfileId))
  }
  const where = filters.length ? and(...filters) : undefined
  const offset = (input.page - 1) * input.limit

  const [rows, totalResult] = await Promise.all([
    db.query.users.findMany({
      where,
      with: { userRoles: { with: { role: true } }, wifiProfile: true },
      orderBy: [desc(users.createdAt), asc(users.name)],
      limit: input.limit,
      offset,
    }),
    db.select({ total: count() }).from(users).where(where),
  ])

  return { data: rows, total: totalResult[0]?.total ?? 0, page: input.page, limit: input.limit }
}

export async function getMember(id: string) {
  return db.query.users.findFirst({
    where: eq(users.id, id),
    with: { userRoles: { with: { role: true } }, wifiProfile: true },
  })
}

export async function updateMember(id: string, input: UpdateMemberInput) {
  return db.transaction(async (tx) => {
    const current = await tx.query.users.findFirst({ where: eq(users.id, id) })
    if (!current) throw new Error('MEMBER_NOT_FOUND')

    const email = input.email?.toLowerCase() ?? current.email
    const wifiProfileId = input.wifiProfileId !== undefined ? input.wifiProfileId : current.wifiProfileId
    const wifiProfile = wifiProfileId ? await getWifiProfile(tx, wifiProfileId) : null

    const [user] = await tx.update(users).set({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.email !== undefined && { email }),
      ...(input.cpf !== undefined && { cpf: input.cpf }),
      ...(input.phone !== undefined && { phone: input.phone }),
      wifiProfileId: wifiProfile?.id ?? null,
      updatedAt: new Date(),
    }).where(eq(users.id, id)).returning()

    if (email !== current.email) {
      await tx.update(radcheck).set({ username: email }).where(eq(radcheck.username, current.email))
      await tx.update(radreply).set({ username: email }).where(eq(radreply.username, current.email))
    }

    if (input.roleId !== undefined) {
      const role = await getRole(tx, input.roleId)
      await tx.delete(userRoles).where(eq(userRoles.userId, id))
      await tx.insert(userRoles).values({ userId: id, roleId: role.id })
    }

    if (input.wifiProfileId !== undefined || email !== current.email) {
      await tx.delete(radreply).where(eq(radreply.username, email))
      if (current.active) await writeRadiusReply(tx, email, wifiProfile)
    }

    return user
  })
}

export async function deactivateMember(id: string) {
  return db.transaction(async (tx) => {
    const user = await tx.query.users.findFirst({ where: eq(users.id, id) })
    if (!user) throw new Error('MEMBER_NOT_FOUND')
    await tx.update(users).set({ active: false, updatedAt: new Date() }).where(eq(users.id, id))
    await tx.delete(sessions).where(eq(sessions.userId, id))
    await tx.delete(radcheck).where(eq(radcheck.username, user.email))
    await tx.delete(radreply).where(eq(radreply.username, user.email))
  })
}

export async function reactivateMember(id: string) {
  const wifiPassword = createWifiPassword()
  return db.transaction(async (tx) => {
    const user = await tx.query.users.findFirst({
      where: eq(users.id, id),
      with: { userRoles: { with: { role: true } }, wifiProfile: true },
    })
    if (!user) throw new Error('MEMBER_NOT_FOUND')

    await tx.update(users).set({ active: true, updatedAt: new Date() }).where(eq(users.id, id))
    await tx.delete(radcheck).where(eq(radcheck.username, user.email))
    await tx.delete(radreply).where(eq(radreply.username, user.email))
    await tx.insert(radcheck).values({ username: user.email, attribute: 'Cleartext-Password', op: ':=', value: wifiPassword })
    await writeRadiusReply(tx, user.email, user.wifiProfile)
    return { wifiPassword }
  })
}

export async function getWifiPassword(id: string) {
  const user = await db.query.users.findFirst({ where: eq(users.id, id) })
  if (!user) throw new Error('MEMBER_NOT_FOUND')
  const credential = await db.query.radcheck.findFirst({
    where: and(eq(radcheck.username, user.email), eq(radcheck.attribute, 'Cleartext-Password')),
  })
  return credential?.value ?? null
}

export async function resetWifiPassword(id: string) {
  const wifiPassword = createWifiPassword()
  return db.transaction(async (tx) => {
    const user = await tx.query.users.findFirst({ where: eq(users.id, id) })
    if (!user) throw new Error('MEMBER_NOT_FOUND')
    if (!user.active) throw new Error('MEMBER_INACTIVE')
    await tx.delete(radcheck).where(eq(radcheck.username, user.email))
    await tx.insert(radcheck).values({ username: user.email, attribute: 'Cleartext-Password', op: ':=', value: wifiPassword })
    return { wifiPassword }
  })
}
