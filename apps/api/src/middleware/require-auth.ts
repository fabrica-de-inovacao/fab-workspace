import type { MiddlewareHandler } from 'hono'
import { db, roles, userRoles, users } from '@fabrica/db'
import { and, eq } from 'drizzle-orm'
import { auth } from '../lib/auth.js'

async function getAuthorizedUser(userId: string) {
  return db.query.users.findFirst({
    where: and(eq(users.id, userId), eq(users.active, true)),
    with: { userRoles: { with: { role: true } } },
  })
}

export const requireAuth: MiddlewareHandler = async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  if (!session) return c.json({ error: 'Não autenticado' }, 401)
  const user = await getAuthorizedUser(session.user.id)
  if (!user) return c.json({ error: 'Usuário inativo' }, 403)
  c.set('session', session)
  c.set('user', user)
  await next()
}

export const requireCoordinator: MiddlewareHandler = async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  if (!session) return c.json({ error: 'Não autenticado' }, 401)
  const user = await getAuthorizedUser(session.user.id)
  if (!user) return c.json({ error: 'Usuário inativo' }, 403)

  if (user.userRoles.length === 0) {
    const [adminRole] = await db.insert(roles)
      .values({ name: 'admin', description: 'Administrador do painel' })
      .onConflictDoUpdate({ target: roles.name, set: { description: 'Administrador do painel' } })
      .returning()
    if (adminRole) {
      await db.insert(userRoles)
        .values({ userId: user.id, roleId: adminRole.id })
        .onConflictDoNothing()
      user.userRoles.push({ userId: user.id, roleId: adminRole.id, assignedAt: new Date(), role: adminRole })
    }
  }

  const hasPermission = user.userRoles.some((ur) => ur.role.name === 'admin' || ur.role.name === 'coordenador')
  if (!hasPermission) {
    return c.json({ error: 'Permissão insuficiente' }, 403)
  }
  c.set('session', session)
  c.set('user', user)
  await next()
}

export const requireAdmin: MiddlewareHandler = async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  if (!session) return c.json({ error: 'Não autenticado' }, 401)
  const user = await getAuthorizedUser(session.user.id)
  if (!user) return c.json({ error: 'Usuário inativo' }, 403)

  if (user.userRoles.length === 0) {
    const [adminRole] = await db.insert(roles)
      .values({ name: 'admin', description: 'Administrador do painel' })
      .onConflictDoUpdate({ target: roles.name, set: { description: 'Administrador do painel' } })
      .returning()
    if (adminRole) {
      await db.insert(userRoles)
        .values({ userId: user.id, roleId: adminRole.id })
        .onConflictDoNothing()
      user.userRoles.push({ userId: user.id, roleId: adminRole.id, assignedAt: new Date(), role: adminRole })
    }
  }

  if (!user.userRoles.some((userRole) => userRole.role.name === 'admin')) {
    return c.json({ error: 'Permissão insuficiente' }, 403)
  }
  c.set('session', session)
  c.set('user', user)
  await next()
}
