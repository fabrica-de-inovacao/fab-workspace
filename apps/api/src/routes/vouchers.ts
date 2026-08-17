import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import { requireCoordinator } from '../middleware/require-auth.js'
import { API_PREFIX } from '../lib/paths.js'
import { generateVoucherBatch, listVouchers, revokeVoucher } from '../services/voucher.service.js'

const jsonContent = (schema: z.ZodType) => ({ content: { 'application/json': { schema } } })
const errorSchema = z.object({ error: z.string() })

export const vouchersRouter = new OpenAPIHono<{ Variables: { user: any; session: any } }>()

const generateBatchSchema = z.object({
  count: z.number().int().min(1).max(100).default(5),
  wifiProfileId: z.number().int().positive().nullable().optional(),
  expiresInDays: z.number().int().min(1).max(90).default(7),
})

// Gerar lote de vouchers — exige admin ou coordenador
const generateBatchRoute = createRoute({
  method: 'post',
  path: `${API_PREFIX}/vouchers/batch`,
  tags: ['Vouchers'],
  summary: 'Gerar lote de vouchers para visitantes',
  middleware: [requireCoordinator],
  request: {
    body: jsonContent(generateBatchSchema),
  },
  responses: {
    201: { description: 'Lote gerado com sucesso', ...jsonContent(z.object({ data: z.array(z.any()) })) },
    400: { description: 'Parâmetros inválidos', ...jsonContent(errorSchema) },
  },
})
vouchersRouter.openapi(generateBatchRoute, async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = generateBatchSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Parâmetros de geração de lote inválidos' }, 400)

  const user = c.get('user')
  const createdVouchers = await generateVoucherBatch({
    count: parsed.data.count,
    wifiProfileId: parsed.data.wifiProfileId ?? null,
    expiresInDays: parsed.data.expiresInDays,
    createdById: user?.id ?? null,
  })

  return c.json({ data: createdVouchers }, 201)
})

// Listar vouchers — exige admin ou coordenador
const listVouchersRoute = createRoute({
  method: 'get',
  path: `${API_PREFIX}/vouchers`,
  tags: ['Vouchers'],
  summary: 'Listar vouchers de visitantes gerados',
  middleware: [requireCoordinator],
  responses: {
    200: { description: 'Lista de vouchers', ...jsonContent(z.object({ data: z.array(z.any()) })) },
  },
})
vouchersRouter.openapi(listVouchersRoute, async (c) => {
  const data = await listVouchers()
  return c.json({ data })
})

// Revogar/deletar voucher — exige admin ou coordenador
const deleteVoucherRoute = createRoute({
  method: 'delete',
  path: `${API_PREFIX}/vouchers/{id}`,
  tags: ['Vouchers'],
  summary: 'Revogar e excluir voucher de visitante',
  middleware: [requireCoordinator],
  request: {
    params: z.object({ id: z.string().min(1) }),
  },
  responses: {
    200: { description: 'Voucher revogado com sucesso', ...jsonContent(z.object({ success: z.boolean() })) },
    400: { description: 'Voucher não encontrado', ...jsonContent(errorSchema) },
  },
})
vouchersRouter.openapi(deleteVoucherRoute, async (c) => {
  try {
    await revokeVoucher(c.req.param('id'))
    return c.json({ success: true })
  } catch {
    return c.json({ error: 'Voucher não encontrado' }, 400)
  }
})
