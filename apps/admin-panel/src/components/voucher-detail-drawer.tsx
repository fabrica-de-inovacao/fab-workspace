import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Check, Copy, QrCode, ShieldOff, Ticket, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRevokeVoucher, type Voucher } from '../hooks/use-vouchers.js'
import { Drawer } from './drawer.js'

export type VoucherDetailDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  voucher: Voucher | null
  onRefresh?: () => void
}

export function VoucherStatusBadge({ voucher }: { voucher: Voucher }) {
  const isExpired = new Date(voucher.expiresAt) < new Date()
  const isUsed = voucher.usedAt !== null

  if (isUsed) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-xs font-medium text-blue-700">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
        Usado
      </span>
    )
  }

  if (isExpired) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200 px-2.5 py-0.5 text-xs font-medium text-red-700">
        <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
        Expirado
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-600" />
      Ativo
    </span>
  )
}

export function VoucherDetailDrawer({ open, onOpenChange, voucher, onRefresh }: VoucherDetailDrawerProps) {
  const revokeVoucher = useRevokeVoucher()
  const [copiedCode, setCopiedCode] = useState(false)
  const [confirmRevoke, setConfirmRevoke] = useState(false)

  if (!voucher) return null

  function copyCode() {
    if (!voucher) return
    navigator.clipboard.writeText(voucher.code)
    setCopiedCode(true)
    toast.success('Código do voucher copiado!')
    setTimeout(() => setCopiedCode(false), 2000)
  }

  async function handleRevoke() {
    if (!voucher) return
    try {
      await revokeVoucher.mutateAsync(voucher.id)
      toast.success('Voucher revogado com sucesso!')
      setConfirmRevoke(false)
      onOpenChange(false)
      onRefresh?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao revogar voucher')
    }
  }

  return (
    <>
      <Drawer
        open={open}
        onOpenChange={(val) => {
          if (!val) setConfirmRevoke(false)
          onOpenChange(val)
        }}
        title="Detalhes do Voucher"
        subtitle="QR Code e informações de acesso para visitantes"
        size="lg"
        footer={
          <div className="flex w-full items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setConfirmRevoke(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-error/30 bg-error/5 px-4 py-2 text-xs font-medium text-error hover:bg-error/10 transition-colors"
            >
              <Trash2 size={14} />
              <span>Inativar / Revogar</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-full bg-primary px-5 py-2 text-xs font-medium text-white hover:bg-primary-hover transition-colors"
            >
              Fechar
            </button>
          </div>
        }
      >
        <div className="space-y-6 text-center">
          {/* Header Status */}
          <div className="flex items-center justify-between rounded-xl bg-surface-soft p-4 border border-hairline">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Ticket size={18} />
              </div>
              <div className="text-left">
                <p className="text-xs font-medium text-ink">Voucher Visitante</p>
                <p className="text-[11px] text-ink-muted">FreeRADIUS / MikroTik</p>
              </div>
            </div>
            <VoucherStatusBadge voucher={voucher} />
          </div>

          {/* QR Code Container */}
          <div className="mx-auto flex flex-col items-center justify-center rounded-2xl bg-white p-6 shadow-sm border border-hairline max-w-xs space-y-4">
            <div className="flex items-center gap-2 text-xs font-medium text-ink-muted">
              <QrCode size={16} className="text-primary" />
              <span>Escaneie no Captive Portal</span>
            </div>

            <div className="p-2 bg-white rounded-xl shadow-xs border border-hairline">
              <QRCodeSVG
                value={voucher.code}
                size={180}
                bgColor="#ffffff"
                fgColor="#0f172a"
                level="H"
                includeMargin={false}
              />
            </div>

            {/* Código em Destaque */}
            <div className="w-full space-y-2">
              <div className="flex items-center justify-between rounded-xl bg-surface-soft border border-hairline p-3">
                <span className="font-mono text-base font-semibold tracking-wider text-primary select-all">
                  {voucher.code}
                </span>
                <button
                  type="button"
                  onClick={copyCode}
                  className="inline-flex items-center gap-1 rounded-lg bg-surface border border-hairline px-3 py-1.5 text-xs font-medium text-ink hover:bg-hairline transition-colors"
                >
                  {copiedCode ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  {copiedCode ? 'Copiado' : 'Copiar'}
                </button>
              </div>
            </div>
          </div>

          {/* Informações detalhadas */}
          <div className="grid grid-cols-2 gap-4 text-left rounded-xl bg-surface-soft p-4 border border-hairline">
            <div>
              <p className="text-[10px] uppercase font-medium tracking-wider text-ink-muted">Perfil Wi-Fi</p>
              <p className="mt-0.5 text-xs font-mono text-primary font-medium">
                {voucher.wifiProfile?.name ?? 'Padrão (Ilimitado)'}
              </p>
            </div>

            <div>
              <p className="text-[10px] uppercase font-medium tracking-wider text-ink-muted">Validade</p>
              <p className="mt-0.5 text-xs text-ink font-medium">
                {new Date(voucher.expiresAt).toLocaleDateString('pt-BR')} às {new Date(voucher.expiresAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            <div>
              <p className="text-[10px] uppercase font-medium tracking-wider text-ink-muted">Gerado Por</p>
              <p className="mt-0.5 text-xs text-ink">
                {voucher.createdBy?.name ?? 'Sistema'}
              </p>
            </div>

            <div>
              <p className="text-[10px] uppercase font-medium tracking-wider text-ink-muted">Data de Criação</p>
              <p className="mt-0.5 text-xs text-ink">
                {new Date(voucher.createdAt).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        </div>
      </Drawer>

      {/* Confirmação de revogação */}
      {confirmRevoke && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center">
          <div className="absolute inset-0 bg-ink/35 backdrop-blur-[2px]" onClick={() => setConfirmRevoke(false)} />
          <div className="relative z-10 w-[calc(100%-2rem)] max-w-md rounded-2xl border border-hairline bg-surface p-6 shadow-2xl">
            <h2 className="text-xl font-light tracking-tight text-ink">Inativar / Revogar Voucher?</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              O código <strong>{voucher.code}</strong> será inativado e excluído do FreeRADIUS. O visitante não conseguirá mais se conectar com este código.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmRevoke(false)}
                className="rounded-full border border-hairline-input px-4 py-2 text-sm text-ink-muted"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleRevoke}
                disabled={revokeVoucher.isPending}
                className="rounded-full bg-error px-4 py-2 text-sm text-white hover:bg-error/90 disabled:opacity-60"
              >
                {revokeVoucher.isPending ? 'Inativando...' : 'Confirmar Inativação'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
