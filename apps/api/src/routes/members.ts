import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import type { Context } from 'hono'
import { db, roles } from '@fabrica/db'
import { asc } from 'drizzle-orm'
import { z } from 'zod'
import { requireAdmin, requireAuth, requireCoordinator } from '../middleware/require-auth.js'
import { API_PREFIX } from '../lib/paths.js'
import {
  createMember,
  createWifiProfile,
  deactivateMember,
  deleteWifiProfile,
  getMember,
  getWifiPassword,
  listMembers,
  listWifiProfiles,
  reactivateMember,
  resetWifiPassword,
  updateMember,
  updateWifiProfile,
} from '../services/member.service.js'

const memberInput = z.object({
  name: z.string().trim().min(2).max(255),
  email: z.email().transform((email) => email.toLowerCase()),
  cpf: z.string().regex(/^\d{11}$/).nullable().optional(),
  phone: z.string().trim().min(8).max(20).nullable().optional(),
  roleId: z.number().int().positive(),
  wifiProfileId: z.number().int().positive().nullable().optional(),
})

const memberUpdate = memberInput.partial()
const idParam = z.string().uuid()
const numericIdParam = z.coerce.number().int().positive()
const errorSchema = z.object({ error: z.string() })
const jsonContent = (schema: z.ZodType) => ({
  content: { 'application/json': { schema } },
})

function errorResponse(c: Context, error: unknown) {
  if (error instanceof Error) {
    if (error.message === 'MEMBER_NOT_FOUND') return c.json({ error: 'Membro não encontrado' }, 404)
    if (error.message === 'ROLE_NOT_FOUND') return c.json({ error: 'Perfil de acesso não encontrado' }, 400)
    if (error.message === 'WIFI_PROFILE_NOT_FOUND') return c.json({ error: 'Perfil de rede não encontrado' }, 400)
    if (error.message === 'MEMBER_INACTIVE') return c.json({ error: 'Membro inativo' }, 409)
  }
  if (typeof error === 'object' && error && 'code' in error && error.code === '23505') {
    return c.json({ error: 'Email, CPF ou nome de perfil já cadastrado' }, 409)
  }
  throw error
}

export const membersRouter = new OpenAPIHono()

// ---------------------------------------------------------------------------
// /api/v1/me — Obter dados e papéis do usuário autenticado
// ---------------------------------------------------------------------------
membersRouter.get(`${API_PREFIX}/me`, requireAuth, async (c: any) => {
  const user = c.get('user')
  const userRoleNames = (user?.userRoles ?? [])
    .map((ur: { role?: { name: string } }) => ur.role?.name)
    .filter((name: string | undefined): name is string => typeof name === 'string')

  return c.json({
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      cpf: user.cpf,
      phone: user.phone,
      active: user.active,
      roles: userRoleNames,
    },
  })
})

membersRouter.use(`${API_PREFIX}/members`, requireCoordinator)
membersRouter.use(`${API_PREFIX}/members/*`, requireCoordinator)
membersRouter.use(`${API_PREFIX}/roles`, requireCoordinator)
membersRouter.use(`${API_PREFIX}/roles/*`, requireCoordinator)
membersRouter.use(`${API_PREFIX}/roles`, async (c, next) => {
  if (c.req.method === 'POST') return requireAdmin(c, next)
  await next()
})
membersRouter.use(`${API_PREFIX}/wifi-profiles`, requireCoordinator)
membersRouter.use(`${API_PREFIX}/wifi-profiles/*`, requireAdmin)

// ---------------------------------------------------------------------------
// Perfis de Acesso ao Sistema (roles)
// ---------------------------------------------------------------------------
const listRolesRoute = createRoute({
  method: 'get', path: `${API_PREFIX}/roles`, tags: ['System Roles'], summary: 'Listar perfis de acesso ao sistema',
  responses: { 200: { description: 'Perfis de acesso', ...jsonContent(z.object({ data: z.array(z.any()) })) } },
})
membersRouter.openapi(listRolesRoute, async (c) => {
  return c.json({ data: await db.select().from(roles).orderBy(asc(roles.name)) })
})

const roleInput = z.object({
  name: z.string().trim().min(2).max(64),
  description: z.string().trim().max(500).nullable().optional(),
})
const createRoleRoute = createRoute({
  method: 'post', path: `${API_PREFIX}/roles`, tags: ['System Roles'], summary: 'Criar perfil de acesso ao sistema',
  request: { body: jsonContent(roleInput) },
  responses: {
    201: { description: 'Perfil de acesso criado', ...jsonContent(z.object({ data: z.any() })) },
    400: { description: 'Dados inválidos', ...jsonContent(errorSchema) },
    409: { description: 'Perfil duplicado', ...jsonContent(errorSchema) },
  },
})
membersRouter.openapi(createRoleRoute, async (c) => {
  const parsed = roleInput.safeParse(await c.req.json().catch(() => null))
  if (!parsed.success) return c.json({ error: 'Dados inválidos', details: parsed.error.flatten().fieldErrors }, 400)

  try {
    const [role] = await db.insert(roles).values(parsed.data).returning()
    return c.json({ data: role }, 201)
  } catch (error) {
    if (typeof error === 'object' && error && 'code' in error && error.code === '23505') {
      return c.json({ error: 'Perfil de acesso já cadastrado' }, 409)
    }
    throw error
  }
})

// ---------------------------------------------------------------------------
// Perfis de Rede Wi-Fi (wifi-profiles)
// ---------------------------------------------------------------------------
const listWifiProfilesRoute = createRoute({
  method: 'get', path: `${API_PREFIX}/wifi-profiles`, tags: ['Wi-Fi Profiles'], summary: 'Listar perfis de rede Wi-Fi',
  responses: { 200: { description: 'Perfis de rede', ...jsonContent(z.object({ data: z.array(z.any()) })) } },
})
membersRouter.openapi(listWifiProfilesRoute, async (c) => {
  return c.json({ data: await listWifiProfiles() })
})

const wifiProfileInput = z.object({
  name: z.string().trim().min(2).max(64),
  description: z.string().trim().max(500).nullable().optional(),
  wifiRateLimit: z.string().trim().max(32).nullable().optional(),
  wifiSessionTimeout: z.number().int().positive().nullable().optional(),
})
const createWifiProfileRoute = createRoute({
  method: 'post', path: `${API_PREFIX}/wifi-profiles`, tags: ['Wi-Fi Profiles'], summary: 'Criar perfil de rede Wi-Fi',
  request: { body: jsonContent(wifiProfileInput) },
  responses: {
    201: { description: 'Perfil de rede criado', ...jsonContent(z.object({ data: z.any() })) },
    400: { description: 'Dados inválidos', ...jsonContent(errorSchema) },
    404: { description: 'Não encontrado', ...jsonContent(errorSchema) },
    409: { description: 'Perfil duplicado', ...jsonContent(errorSchema) },
  },
})
membersRouter.openapi(createWifiProfileRoute, async (c) => {
  const parsed = wifiProfileInput.safeParse(await c.req.json().catch(() => null))
  if (!parsed.success) return c.json({ error: 'Dados inválidos', details: parsed.error.flatten().fieldErrors }, 400)
  try {
    return c.json({ data: await createWifiProfile(parsed.data) }, 201)
  } catch (error) {
    return errorResponse(c, error)
  }
})

const updateWifiProfileRoute = createRoute({
  method: 'patch', path: `${API_PREFIX}/wifi-profiles/{id}`, tags: ['Wi-Fi Profiles'], summary: 'Atualizar perfil de rede Wi-Fi',
  request: { params: z.object({ id: numericIdParam }), body: jsonContent(wifiProfileInput.partial()) },
  responses: {
    200: { description: 'Perfil de rede atualizado', ...jsonContent(z.any()) },
    400: { description: 'Dados inválidos', ...jsonContent(errorSchema) },
    404: { description: 'Não encontrado', ...jsonContent(errorSchema) },
    409: { description: 'Perfil duplicado', ...jsonContent(errorSchema) },
  },
})
membersRouter.openapi(updateWifiProfileRoute, async (c) => {
  const id = numericIdParam.safeParse(c.req.param('id'))
  const body = wifiProfileInput.partial().safeParse(await c.req.json().catch(() => null))
  if (!id.success || !body.success) return c.json({ error: 'Dados inválidos' }, 400)
  try {
    const updateData = {
      ...(body.data.name !== undefined && { name: body.data.name }),
      ...(body.data.description !== undefined && { description: body.data.description }),
      ...(body.data.wifiRateLimit !== undefined && { wifiRateLimit: body.data.wifiRateLimit }),
      ...(body.data.wifiSessionTimeout !== undefined && { wifiSessionTimeout: body.data.wifiSessionTimeout }),
    }
    return c.json({ data: await updateWifiProfile(id.data, updateData) }, 200)
  } catch (error) {
    return errorResponse(c, error)
  }
})

const deleteWifiProfileRoute = createRoute({
  method: 'delete', path: `${API_PREFIX}/wifi-profiles/{id}`, tags: ['Wi-Fi Profiles'], summary: 'Excluir perfil de rede Wi-Fi',
  request: { params: z.object({ id: numericIdParam }) },
  responses: {
    200: { description: 'Perfil de rede excluído', ...jsonContent(z.object({ success: z.boolean() })) },
    400: { description: 'ID inválido', ...jsonContent(errorSchema) },
  },
})
membersRouter.openapi(deleteWifiProfileRoute, async (c) => {
  const id = numericIdParam.safeParse(c.req.param('id'))
  if (!id.success) return c.json({ error: 'ID inválido' }, 400)
  await deleteWifiProfile(id.data)
  return c.json({ success: true }, 200)
})

// ---------------------------------------------------------------------------
// Membros (members)
// ---------------------------------------------------------------------------
const listMembersQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  roleId: z.coerce.number().int().positive().optional(),
  wifiProfileId: z.coerce.number().int().positive().optional(),
})
const listMembersRoute = createRoute({
  method: 'get', path: `${API_PREFIX}/members`, tags: ['Members'], summary: 'Listar membros',
  request: { query: listMembersQuery },
  responses: {
    200: { description: 'Lista paginada', ...jsonContent(z.any()) },
    400: { description: 'Filtros inválidos', ...jsonContent(errorSchema) },
  },
})
membersRouter.openapi(listMembersRoute, async (c) => {
  const parsed = listMembersQuery.safeParse(c.req.query())
  if (!parsed.success) return c.json({ error: 'Filtros inválidos' }, 400)

  const result = await listMembers({
    page: parsed.data.page,
    limit: parsed.data.limit,
    ...(parsed.data.search && { search: parsed.data.search }),
    ...(parsed.data.status && { active: parsed.data.status === 'active' }),
    ...(parsed.data.roleId && { roleId: parsed.data.roleId }),
    ...(parsed.data.wifiProfileId && { wifiProfileId: parsed.data.wifiProfileId }),
  })
  return c.json(result)
})

const createMemberRoute = createRoute({
  method: 'post', path: `${API_PREFIX}/members`, tags: ['Members'], summary: 'Criar membro e provisionar Wi-Fi',
  request: { body: jsonContent(memberInput) },
  responses: {
    201: { description: 'Membro criado', ...jsonContent(z.any()) },
    400: { description: 'Dados inválidos', ...jsonContent(errorSchema) },
    404: { description: 'Não encontrado', ...jsonContent(errorSchema) },
    409: { description: 'Email ou CPF duplicado', ...jsonContent(errorSchema) },
  },
})
membersRouter.openapi(createMemberRoute, async (c) => {
  const parsed = memberInput.safeParse(await c.req.json().catch(() => null))
  if (!parsed.success) return c.json({ error: 'Dados inválidos', details: parsed.error.flatten().fieldErrors }, 400)
  try {
    return c.json({ data: await createMember(parsed.data) }, 201)
  } catch (error) {
    return errorResponse(c, error)
  }
})

const memberPath = z.object({ id: idParam })
const getMemberRoute = createRoute({
  method: 'get', path: `${API_PREFIX}/members/{id}`, tags: ['Members'], summary: 'Detalhar membro',
  request: { params: memberPath },
  responses: {
    200: { description: 'Membro', ...jsonContent(z.any()) },
    400: { description: 'ID inválido', ...jsonContent(errorSchema) },
    404: { description: 'Não encontrado', ...jsonContent(errorSchema) },
  },
})
membersRouter.openapi(getMemberRoute, async (c) => {
  const id = idParam.safeParse(c.req.param('id'))
  if (!id.success) return c.json({ error: 'ID inválido' }, 400)
  const member = await getMember(id.data)
  return member ? c.json({ data: member }) : c.json({ error: 'Membro não encontrado' }, 404)
})

const updateMemberRoute = createRoute({
  method: 'patch', path: `${API_PREFIX}/members/{id}`, tags: ['Members'], summary: 'Atualizar membro',
  request: { params: memberPath, body: jsonContent(memberUpdate) },
  responses: {
    200: { description: 'Membro atualizado', ...jsonContent(z.any()) },
    400: { description: 'Dados inválidos', ...jsonContent(errorSchema) },
    404: { description: 'Não encontrado', ...jsonContent(errorSchema) },
    409: { description: 'Conflito', ...jsonContent(errorSchema) },
  },
})
membersRouter.openapi(updateMemberRoute, async (c) => {
  const id = idParam.safeParse(c.req.param('id'))
  const body = memberUpdate.safeParse(await c.req.json().catch(() => null))
  if (!id.success || !body.success) return c.json({ error: 'Dados inválidos' }, 400)
  try {
    return c.json({ data: await updateMember(id.data, body.data) })
  } catch (error) {
    return errorResponse(c, error)
  }
})

const deactivateRoute = createRoute({
  method: 'post', path: `${API_PREFIX}/members/{id}/deactivate`, tags: ['Members'], summary: 'Inativar membro e revogar Wi-Fi',
  request: { params: memberPath }, responses: {
    200: { description: 'Inativado', ...jsonContent(z.any()) },
    400: { description: 'ID inválido', ...jsonContent(errorSchema) },
    404: { description: 'Não encontrado', ...jsonContent(errorSchema) },
    409: { description: 'Conflito', ...jsonContent(errorSchema) },
  },
})
membersRouter.openapi(deactivateRoute, async (c) => {
  const id = idParam.safeParse(c.req.param('id'))
  if (!id.success) return c.json({ error: 'ID inválido' }, 400)
  try {
    await deactivateMember(id.data)
    return c.json({ data: { active: false } })
  } catch (error) {
    return errorResponse(c, error)
  }
})

const reactivateRoute = createRoute({
  method: 'post', path: `${API_PREFIX}/members/{id}/reactivate`, tags: ['Members'], summary: 'Reativar membro e reprovisionar Wi-Fi',
  request: { params: memberPath }, responses: {
    200: { description: 'Reativado', ...jsonContent(z.any()) },
    400: { description: 'Dados inválidos', ...jsonContent(errorSchema) },
    404: { description: 'Não encontrado', ...jsonContent(errorSchema) },
    409: { description: 'Conflito', ...jsonContent(errorSchema) },
  },
})
membersRouter.openapi(reactivateRoute, async (c) => {
  const id = idParam.safeParse(c.req.param('id'))
  if (!id.success) return c.json({ error: 'ID inválido' }, 400)
  try {
    return c.json({ data: await reactivateMember(id.data) })
  } catch (error) {
    return errorResponse(c, error)
  }
})

const wifiPasswordRoute = createRoute({
  method: 'get', path: `${API_PREFIX}/members/{id}/wifi-password`, tags: ['Members'], summary: 'Consultar senha Wi-Fi',
  request: { params: memberPath }, responses: {
    200: { description: 'Senha atual', ...jsonContent(z.any()) },
    400: { description: 'ID inválido', ...jsonContent(errorSchema) },
    404: { description: 'Não encontrado', ...jsonContent(errorSchema) },
    409: { description: 'Conflito', ...jsonContent(errorSchema) },
  },
})
membersRouter.openapi(wifiPasswordRoute, async (c) => {
  const id = idParam.safeParse(c.req.param('id'))
  if (!id.success) return c.json({ error: 'ID inválido' }, 400)
  try {
    return c.json({ data: { password: await getWifiPassword(id.data) } })
  } catch (error) {
    return errorResponse(c, error)
  }
})

const resetWifiRoute = createRoute({
  method: 'post', path: `${API_PREFIX}/members/{id}/reset-wifi-password`, tags: ['Members'], summary: 'Redefinir senha Wi-Fi',
  request: { params: memberPath }, responses: {
    200: { description: 'Nova senha', ...jsonContent(z.any()) },
    400: { description: 'Dados inválidos', ...jsonContent(errorSchema) },
    404: { description: 'Não encontrado', ...jsonContent(errorSchema) },
    409: { description: 'Membro inativo', ...jsonContent(errorSchema) },
  },
})
membersRouter.openapi(resetWifiRoute, async (c) => {
  const id = idParam.safeParse(c.req.param('id'))
  if (!id.success) return c.json({ error: 'ID inválido' }, 400)
  try {
    return c.json({ data: await resetWifiPassword(id.data) })
  } catch (error) {
    return errorResponse(c, error)
  }
})
