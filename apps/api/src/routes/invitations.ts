import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import { requireCoordinator } from '../middleware/require-auth.js'
import { API_PREFIX } from '../lib/paths.js'
import { acceptInvitation, createInvitation, verifyInvitation } from '../services/invitation.service.js'

const jsonContent = (schema: z.ZodType) => ({ content: { 'application/json': { schema } } })
const errorSchema = z.object({ error: z.string() })

export const invitationsRouter = new OpenAPIHono()

const createInviteSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().email().transform((e) => e.toLowerCase()),
  cpf: z.string().regex(/^\d{11}$/).nullable().optional(),
  phone: z.string().trim().min(8).max(20).nullable().optional(),
  roleId: z.number().int().positive(),
  wifiProfileId: z.number().int().positive().nullable().optional(),
  sendEmail: z.boolean().default(true),
})

// Criar convite — exige papel admin ou coordenador
const createInviteRoute = createRoute({
  method: 'post',
  path: `${API_PREFIX}/invitations`,
  tags: ['Invitations'],
  summary: 'Criar e enviar convite para novo membro',
  middleware: [requireCoordinator],
  request: {
    body: jsonContent(createInviteSchema),
  },
  responses: {
    201: { description: 'Convite criado', ...jsonContent(z.object({ data: z.any() })) },
    400: { description: 'Dados inválidos', ...jsonContent(errorSchema) },
    409: { description: 'Email/CPF duplicado ou convite ativo', ...jsonContent(errorSchema) },
  },
})
invitationsRouter.openapi(createInviteRoute, async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = createInviteSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Dados inválidos' }, 400)

  try {
    const result = await createInvitation(parsed.data)
    return c.json({ data: result }, 201)
  } catch (error) {
    if (typeof error === 'object' && error && 'code' in error && error.code === '23505') {
      return c.json({ error: 'Convite ativo ou conta já cadastrada para este email' }, 409)
    }
    throw error
  }
})

// Verificar token de convite — pública
const verifyInviteRoute = createRoute({
  method: 'get',
  path: `${API_PREFIX}/invitations/verify/{token}`,
  tags: ['Invitations'],
  summary: 'Verificar se o token de convite é válido',
  request: { params: z.object({ token: z.string().min(1) }) },
  responses: {
    200: { description: 'Convite válido', ...jsonContent(z.object({ data: z.any() })) },
    400: { description: 'Convite inválido ou expirado', ...jsonContent(errorSchema) },
  },
})
invitationsRouter.openapi(verifyInviteRoute, async (c) => {
  try {
    const invitation = await verifyInvitation(c.req.param('token'))
    return c.json({ data: invitation })
  } catch {
    return c.json({ error: 'Convite inválido ou expirado' }, 400)
  }
})

const acceptInviteSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
})

// Aceitar convite e concluir cadastro — pública
const acceptInviteRoute = createRoute({
  method: 'post',
  path: `${API_PREFIX}/invitations/accept`,
  tags: ['Invitations'],
  summary: 'Concluir cadastro e definir senha do painel',
  request: {
    body: jsonContent(acceptInviteSchema),
  },
  responses: {
    200: { description: 'Cadastro concluído', ...jsonContent(z.object({ data: z.any() })) },
    400: { description: 'Token ou dados inválidos', ...jsonContent(errorSchema) },
  },
})
invitationsRouter.openapi(acceptInviteRoute, async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = acceptInviteSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Dados inválidos ou senha curta (mínimo 8 caracteres)' }, 400)

  try {
    const result = await acceptInvitation(parsed.data)
    return c.json({ data: result })
  } catch (error) {
    if (error instanceof Error && error.message === 'INVITATION_INVALID') {
      return c.json({ error: 'Convite inválido ou expirado' }, 400)
    }
    throw error
  }
})
