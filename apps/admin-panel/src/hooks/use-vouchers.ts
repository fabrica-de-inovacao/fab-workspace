import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api.js'

export type Voucher = {
  id: string
  code: string
  wifiProfileId: number | null
  expiresAt: string
  usedAt: string | null
  createdAt: string
  wifiProfile: { id: number; name: string; wifiRateLimit: string | null } | null
  createdBy: { id: string; name: string; email: string } | null
}

export type GenerateVoucherBatchInput = {
  count: number
  wifiProfileId?: number | null
  expiresInDays?: number
}

export function useVouchers() {
  return useQuery({
    queryKey: ['vouchers'],
    queryFn: () => api<{ data: Voucher[] }>('/vouchers'),
  })
}

export function useGenerateVoucherBatch() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: GenerateVoucherBatchInput) =>
      api<{ data: Voucher[] }>('/vouchers/batch', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['vouchers'] }),
  })
}

export function useRevokeVoucher() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api<{ success: boolean }>(`/vouchers/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['vouchers'] }),
  })
}
