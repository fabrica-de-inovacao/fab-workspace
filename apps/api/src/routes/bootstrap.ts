import { hashPassword } from 'better-auth/crypto'
import { OpenAPIHono } from '@hono/zod-openapi'
import { db, accounts, users } from '@fabrica/db'
import { sql } from 'drizzle-orm'
import { z } from 'zod'

const bodySchema = z.object({
  name: z.string().trim().min(2),
  email: z.email().transform((email) => email.toLowerCase()),
  password: z.string().min(8),
})

export const bootstrapRouter = new OpenAPIHono()

bootstrapRouter.post('/api/bootstrap/admin', async (c) => {
  const body = bodySchema.safeParse(await c.req.json().catch(() => null))
  if (!body.success) {
    return c.json({ error: 'Dados inválidos', details: body.error.flatten().fieldErrors }, 400)
  }

  const userId = crypto.randomUUID()
  const accountId = crypto.randomUUID()

  try {
    await db.transaction(async (tx) => {
      // Serializa tentativas concorrentes de bootstrap nesta transação.
      await tx.execute(sql`LOCK TABLE ${users} IN ACCESS EXCLUSIVE MODE`)
      const result = await tx.select({ count: sql<number>`count(*)::int` }).from(users)
      const count = result[0]?.count ?? 0

      if (count !== 0) throw new Error('BOOTSTRAP_CLOSED')

      await tx.insert(users).values({
        id: userId,
        name: body.data.name,
        email: body.data.email,
        emailVerified: true,
        active: true,
      })

      await tx.insert(accounts).values({
        id: accountId,
        accountId: userId,
        providerId: 'credential',
        userId,
        password: await hashPassword(body.data.password),
      })
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'BOOTSTRAP_CLOSED') {
      return c.json({ error: 'Bootstrap já concluído' }, 409)
    }
    throw error
  }

  return c.json({ data: { id: userId, name: body.data.name, email: body.data.email } }, 201)
})
