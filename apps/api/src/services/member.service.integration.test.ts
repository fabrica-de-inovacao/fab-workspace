import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const testDatabaseUrl = process.env['TEST_DATABASE_URL']
const integration = testDatabaseUrl ? describe : describe.skip

integration('member RADIUS transaction integration', () => {
  let database: typeof import('@fabrica/db')
  let service: typeof import('./member.service.js')
  let roleId: number
  const email = `integration-${randomUUID()}@example.test`

  beforeAll(async () => {
    process.env['DATABASE_URL'] = testDatabaseUrl
    database = await import('@fabrica/db')
    service = await import('./member.service.js')
    const [role] = await database.db.insert(database.roles).values({ name: `Integration ${randomUUID()}` }).returning()
    if (!role) throw new Error('Failed to create integration role')
    roleId = role.id
  })

  afterAll(async () => {
    if (!database || !roleId) return
    await database.db.delete(database.roles).where((await import('drizzle-orm')).eq(database.roles.id, roleId))
  })

  it('creates the user and RADIUS credential together', async () => {
    const result = await service.createMember({ name: 'Integration Test', email, roleId })
    const credential = await database.db.query.radcheck.findFirst({
      where: (await import('drizzle-orm')).eq(database.radcheck.username, email),
    })

    expect(result.user.email).toBe(email)
    expect(credential?.attribute).toBe('Cleartext-Password')
  })

  it('deactivation removes RADIUS check and reply records', async () => {
    const user = await database.db.query.users.findFirst({
      where: (await import('drizzle-orm')).eq(database.users.email, email),
    })
    if (!user) throw new Error('Integration user not found')

    await service.deactivateMember(user.id)
    const [check, reply] = await Promise.all([
      database.db.query.radcheck.findFirst({ where: (await import('drizzle-orm')).eq(database.radcheck.username, email) }),
      database.db.query.radreply.findFirst({ where: (await import('drizzle-orm')).eq(database.radreply.username, email) }),
    ])

    expect(check).toBeUndefined()
    expect(reply).toBeUndefined()
    await database.db.delete(database.users).where((await import('drizzle-orm')).eq(database.users.id, user.id))
  })
})
