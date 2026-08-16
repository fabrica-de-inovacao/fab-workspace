import { randomBytes, randomUUID } from 'node:crypto'
import {
  db,
  radcheck,
  radreply,
  roles,
  userRoles,
  users,
} from '@fabrica/db'
import { and, asc, count, desc, eq, ilike, inArray, or, sql } from 'drizzle-orm'

const WIFI_PASSWORD_BYTES = 12

export type CreateMemberInput = {
  name: string
  email: string
  cpf?: string | null | undefined
  phone?: string | null | undefined
  roleId: number
}

export type UpdateMemberInput = {
  name?: string | undefined
  email?: string | undefined
  cpf?: string | null | undefined
  phone?: string | null | undefined
  roleId?: number | undefined
}

export type ListMembersInput = {
  page: number
  limit: number
  search?: string
  active?: boolean
  roleId?: number
}

function createWifiPassword() {
  return randomBytes(WIFI_PASSWORD_BYTES).toString('base64url')
}

async function getRole(tx: Parameters<Parameters<typeof db.transaction>[0]>[0], roleId: number) {
  const role = await tx.query.roles.findFirst({ where: eq(roles.id, roleId) })
  if (!role) throw new Error('ROLE_NOT_FOUND')
  return role
}

async function writeRadiusReply(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  username: string,
  role: typeof roles.$inferSelect,
) {
  const attributes = []
  if (role.wifiRateLimit) {
    attributes.push({ username, attribute: 'Mikrotik-Rate-Limit', op: '=', value: role.wifiRateLimit })
  }
  if (role.wifiSessionTimeout) {
    attributes.push({ username, attribute: 'Session-Timeout', op: '=', value: String(role.wifiSessionTimeout) })
  }
  if (attributes.length) await tx.insert(radreply).values(attributes)
}

export async function createMember(input: CreateMemberInput) {
  const wifiPassword = createWifiPassword()

  return db.transaction(async (tx) => {
    const role = await getRole(tx, input.roleId)
    const [user] = await tx.insert(users).values({
      id: randomUUID(),
      name: input.name,
      email: input.email.toLowerCase(),
      cpf: input.cpf ?? null,
      phone: input.phone ?? null,
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
    await writeRadiusReply(tx, user.email, role)

    return { user, role, wifiPassword }
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
  const where = filters.length ? and(...filters) : undefined
  const offset = (input.page - 1) * input.limit

  const [rows, totalResult] = await Promise.all([
    db.query.users.findMany({
      where,
      with: { userRoles: { with: { role: true } } },
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
    with: { userRoles: { with: { role: true } } },
  })
}

export async function updateMember(id: string, input: UpdateMemberInput) {
  return db.transaction(async (tx) => {
    const current = await tx.query.users.findFirst({ where: eq(users.id, id) })
    if (!current) throw new Error('MEMBER_NOT_FOUND')

    const email = input.email?.toLowerCase() ?? current.email
    const [user] = await tx.update(users).set({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.email !== undefined && { email }),
      ...(input.cpf !== undefined && { cpf: input.cpf }),
      ...(input.phone !== undefined && { phone: input.phone }),
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
      await tx.delete(radreply).where(eq(radreply.username, email))
      if (current.active) await writeRadiusReply(tx, email, role)
    }

    return user
  })
}

export async function deactivateMember(id: string) {
  return db.transaction(async (tx) => {
    const user = await tx.query.users.findFirst({ where: eq(users.id, id) })
    if (!user) throw new Error('MEMBER_NOT_FOUND')
    await tx.update(users).set({ active: false, updatedAt: new Date() }).where(eq(users.id, id))
    await tx.delete(radcheck).where(eq(radcheck.username, user.email))
    await tx.delete(radreply).where(eq(radreply.username, user.email))
  })
}

export async function reactivateMember(id: string) {
  const wifiPassword = createWifiPassword()
  return db.transaction(async (tx) => {
    const user = await tx.query.users.findFirst({
      where: eq(users.id, id),
      with: { userRoles: { with: { role: true } } },
    })
    if (!user) throw new Error('MEMBER_NOT_FOUND')
    const role = user.userRoles[0]?.role
    if (!role) throw new Error('ROLE_NOT_FOUND')

    await tx.update(users).set({ active: true, updatedAt: new Date() }).where(eq(users.id, id))
    await tx.delete(radcheck).where(eq(radcheck.username, user.email))
    await tx.delete(radreply).where(eq(radreply.username, user.email))
    await tx.insert(radcheck).values({ username: user.email, attribute: 'Cleartext-Password', op: ':=', value: wifiPassword })
    await writeRadiusReply(tx, user.email, role)
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
