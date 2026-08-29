import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Check, Copy, QrCode, Ticket, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRevokeVoucher, type Voucher } from '../hooks/use-vouchers.js'
import { formatVoucherCode } from '../lib/voucher-utils.js'
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
      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-medium text-primary">
        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
        Usado
      </span>
    )
  }

  if (isExpired) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-error-soft px-2.5 py-0.5 text-xs font-medium text-error">
        <span className="h-1.5 w-1.5 rounded-full bg-error" />
        Expirado
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary-soft px-2.5 py-0.5 text-xs font-medium text-secondary-700">
      <span className="h-1.5 w-1.5 rounded-full bg-secondary-700" />
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
    navigator.clipboard.writeText(formatVoucherCode(voucher.code))
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
        subtitle="QR Code e credenciais de acesso para visitantes"
        size="lg"
        footer={
          <div className="flex w-full items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setConfirmRevoke(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-error/30 bg-error-soft/40 px-3.5 py-2 text-xs font-medium text-error transition-colors hover:bg-error-soft"
            >
              <Trash2 size={14} />
              <span>Inativar / Revogar</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-full bg-primary px-5 py-2 text-xs font-medium text-white transition-colors hover:bg-primary-hover"
            >
              Fechar
            </button>
          </div>
        }
      >
        <div className="space-y-6 text-center">
          {/* Header Status */}
          <div className="flex items-center justify-between rounded-2xl bg-surface-soft p-4 border border-hairline">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft text-primary">
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
          <div className="mx-auto flex flex-col items-center justify-center rounded-2xl bg-surface-soft p-6 border border-hairline max-w-xs space-y-4">
            <div className="flex items-center gap-2 text-xs font-medium text-ink-muted">
              <QrCode size={16} className="text-primary" />
              <span>Escaneie no Captive Portal</span>
            </div>

            {/* Inset optical wrapper for QR Code */}
            <div className="p-3 bg-white rounded-2xl shadow-xs border border-hairline">
              <QRCodeSVG
                value={formatVoucherCode(voucher.code)}
                size={180}
                bgColor="#ffffff"
                fgColor="#0f172a"
                level="H"
                includeMargin={false}
              />
            </div>

            {/* Código em Destaque */}
            <div className="w-full space-y-2">
              <div className="flex items-center justify-between rounded-xl bg-surface border border-hairline p-3 shadow-xs">
                <span className="font-mono text-base font-semibold tracking-wider text-primary select-all">
                  {formatVoucherCode(voucher.code)}
                </span>
                <button
                  type="button"
                  onClick={copyCode}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-surface-soft border border-hairline px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                >
                  {copiedCode ? <Check size={14} className="text-secondary-700" /> : <Copy size={14} />}
                  <span>{copiedCode ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Informações detalhadas */}
          <div className="grid grid-cols-2 gap-4 text-left rounded-2xl bg-surface-soft p-4 border border-hairline">
            <div>
              <p className="text-[10px] uppercase font-semibold tracking-wider text-ink-muted/70">Perfil Wi-Fi</p>
              <p className="mt-0.5 text-xs font-mono text-primary font-medium">
                {voucher.wifiProfile?.name ?? 'Padrão (Ilimitado)'}
              </p>
            </div>

            <div>
              <p className="text-[10px] uppercase font-semibold tracking-wider text-ink-muted/70">Validade</p>
              <p className="mt-0.5 text-xs text-ink font-medium">
                {new Date(voucher.expiresAt).toLocaleDateString('pt-BR')} às {new Date(voucher.expiresAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            <div>
              <p className="text-[10px] uppercase font-semibold tracking-wider text-ink-muted/70">Gerado Por</p>
              <p className="mt-0.5 text-xs text-ink">
                {voucher.createdBy?.name ?? 'Sistema'}
              </p>
            </div>

            <div>
              <p className="text-[10px] uppercase font-semibold tracking-wider text-ink-muted/70">Data de Criação</p>
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
          <div className="relative z-10 w-[calc(100%-2rem)] max-w-md rounded-3xl border border-hairline bg-surface p-6 shadow-2xl animate-[fadeUp_0.15s_ease-out]">
            <h2 className="text-lg font-medium tracking-tight text-ink">Inativar / Revogar Voucher?</h2>
            <p className="mt-2 text-xs leading-relaxed text-ink-muted">
              O código <strong className="font-mono text-primary">{formatVoucherCode(voucher.code)}</strong> será inativado e excluído do FreeRADIUS. O visitante não conseguirá mais se conectar com este código.
            </p>
            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmRevoke(false)}
                className="rounded-full border border-hairline-input px-4 py-2 text-xs font-medium text-ink-muted transition-colors hover:border-primary hover:text-ink"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleRevoke}
                disabled={revokeVoucher.isPending}
                className="rounded-full bg-error px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-error/90 disabled:opacity-60"
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
