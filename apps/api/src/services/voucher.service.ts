import { randomBytes, randomUUID } from 'node:crypto'
import {
  db,
  radcheck,
  radreply,
  vouchers,
  wifiProfiles,
} from '@fabrica/db'
import { desc, eq } from 'drizzle-orm'

export type GenerateVoucherBatchInput = {
  count: number
  wifiProfileId?: number | null | undefined
  expiresInDays?: number | undefined
  createdById?: string | null | undefined
}

export function cleanVoucherCode(code: string): string {
  return code.replace(/[^A-Z0-9]/gi, '').toUpperCase()
}

function generateVoucherCode() {
  const segment1 = randomBytes(2).toString('hex').toUpperCase()
  const segment2 = randomBytes(2).toString('hex').toUpperCase()
  return cleanVoucherCode(`FAB${segment1}${segment2}`)
}

export async function generateVoucherBatch(input: GenerateVoucherBatchInput) {
  const count = Math.min(Math.max(1, input.count), 100)
  const expiresInDays = input.expiresInDays ?? 7
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)

  return db.transaction(async (tx) => {
    let wifiProfile = null
    if (input.wifiProfileId) {
      wifiProfile = await tx.query.wifiProfiles.findFirst({ where: eq(wifiProfiles.id, input.wifiProfileId) })
    }

    const createdVouchers = []
    const radcheckValues = []
    const radreplyValues = []

    for (let i = 0; i < count; i++) {
      const id = randomUUID()
      const code = generateVoucherCode()

      createdVouchers.push({
        id,
        code,
        wifiProfileId: wifiProfile?.id ?? null,
        expiresAt,
        createdBy: input.createdById ?? null,
      })

      // radcheck: username = code (limpo/sem traços), value = code
      radcheckValues.push({
        username: code,
        attribute: 'Cleartext-Password',
        op: ':=',
        value: code,
      })

      // radreply: regras de banda/timeout se tiver perfil
      if (wifiProfile) {
        if (wifiProfile.wifiRateLimit) {
          radreplyValues.push({ username: code, attribute: 'Mikrotik-Rate-Limit', op: '=', value: wifiProfile.wifiRateLimit })
        }
        if (wifiProfile.wifiSessionTimeout) {
          radreplyValues.push({ username: code, attribute: 'Session-Timeout', op: '=', value: String(wifiProfile.wifiSessionTimeout) })
        }
      }
    }

    const insertedVouchers = await tx.insert(vouchers).values(createdVouchers).returning()
    await tx.insert(radcheck).values(radcheckValues)
    if (radreplyValues.length) {
      await tx.insert(radreply).values(radreplyValues)
    }

    return insertedVouchers
  })
}

export async function listVouchers() {
  return db.query.vouchers.findMany({
    with: {
      createdBy: true,
      wifiProfile: true,
    },
    orderBy: [desc(vouchers.createdAt)],
  })
}

export async function revokeVoucher(id: string) {
  return db.transaction(async (tx) => {
    const voucher = await tx.query.vouchers.findFirst({ where: eq(vouchers.id, id) })
    if (!voucher) throw new Error('VOUCHER_NOT_FOUND')

    const cleanCode = cleanVoucherCode(voucher.code)

    await tx.delete(vouchers).where(eq(vouchers.id, id))
    await tx.delete(radcheck).where(eq(radcheck.username, cleanCode))
    await tx.delete(radreply).where(eq(radreply.username, cleanCode))
  })
}
