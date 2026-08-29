import { useMemo, useState } from 'react'
import { Check, Copy, Eye, Plus, QrCode, Ticket, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useGenerateVoucherBatch, useRevokeVoucher, useVouchers, type Voucher } from '../hooks/use-vouchers.js'
import { useWifiProfiles } from '../hooks/use-members.js'
import { formatVoucherCode } from '../lib/voucher-utils.js'
import { DataTable, type Column, type SortState } from '../components/data-table.js'
import { Drawer } from '../components/drawer.js'
import { DropdownMenu } from '../components/dropdown-menu.js'
import { EmptyState, SkeletonRow } from '../components/feedback.js'
import { FormSelect } from '../components/form-select.js'
import { PageBody, PageFooter, PageHeader, PageShell } from '../components/page.js'
import { SearchInput } from '../components/search-input.js'
import { VoucherDetailDrawer, VoucherStatusBadge } from '../components/voucher-detail-drawer.js'

type StatusFilter = 'all' | 'active' | 'used' | 'expired'

export function VouchersPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sort, setSort] = useState<SortState>({ key: 'createdAt', direction: 'desc' })
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [revokeVoucherItem, setRevokeVoucherItem] = useState<Voucher | null>(null)

  // Form de geração de lote
  const [count, setCount] = useState('5')
  const [wifiProfileId, setWifiProfileId] = useState('')
  const [expiresInDays, setExpiresInDays] = useState('7')

  const vouchers = useVouchers()
  const wifiProfiles = useWifiProfiles()
  const generateBatch = useGenerateVoucherBatch()
  const revokeVoucher = useRevokeVoucher()

  const allVouchers = vouchers.data?.data ?? []

  // Métricas
  const stats = useMemo(() => {
    const now = new Date()
    let active = 0
    let used = 0
    let expired = 0

    allVouchers.forEach((v) => {
      if (v.usedAt) {
        used++
      } else if (new Date(v.expiresAt) < now) {
        expired++
      } else {
        active++
      }
    })

    return { total: allVouchers.length, active, used, expired }
  }, [allVouchers])

  function applyPreset(days: number, qty: number, profileId?: number) {
    setExpiresInDays(String(days))
    setCount(String(qty))
    if (profileId) setWifiProfileId(String(profileId))
  }

  async function handleGenerate() {
    const numCount = Number(count)
    if (!numCount || numCount < 1) return
    try {
      await generateBatch.mutateAsync({
        count: numCount,
        wifiProfileId: wifiProfileId ? Number(wifiProfileId) : null,
        expiresInDays: Number(expiresInDays) || 7,
      })
      toast.success(`${numCount} voucher(s) gerado(s) com sucesso!`)
      setCreateOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao gerar vouchers')
    }
  }

  async function handleRevoke() {
    if (!revokeVoucherItem) return
    try {
      await revokeVoucher.mutateAsync(revokeVoucherItem.id)
      toast.success('Voucher revogado com sucesso')
      setRevokeVoucherItem(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao revogar voucher')
    }
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    toast.success('Código do voucher copiado!')
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const filtered = useMemo(() => {
    const now = new Date()
    return allVouchers.filter((v) => {
      const matchSearch =
        !search ||
        v.code.toLowerCase().includes(search.toLowerCase()) ||
        v.createdBy?.name.toLowerCase().includes(search.toLowerCase())

      if (!matchSearch) return false

      if (statusFilter === 'active') {
        return !v.usedAt && new Date(v.expiresAt) >= now
      }
      if (statusFilter === 'used') {
        return !!v.usedAt
      }
      if (statusFilter === 'expired') {
        return !v.usedAt && new Date(v.expiresAt) < now
      }

      return true
    })
  }, [allVouchers, search, statusFilter])

  const columns: Column<Voucher>[] = [
    {
      key: 'code',
      header: 'Código do Voucher',
      sortValue: (v) => v.code,
      render: (v) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <Ticket size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedVoucher(v)}
                className="font-mono text-sm font-semibold tracking-wider text-ink hover:text-primary transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 rounded"
              >
                {formatVoucherCode(v.code)}
              </button>
              <button
                type="button"
                onClick={() => copyCode(v.code)}
                className="text-ink-muted/50 hover:text-ink transition-colors p-1 rounded hover:bg-surface-soft"
                title="Copiar código"
              >
                {copiedCode === v.code ? <Check size={14} className="text-secondary-700" /> : <Copy size={14} />}
              </button>
            </div>
            <p className="text-[11px] text-ink-muted">
              Criado por {v.createdBy?.name ?? 'Sistema'} em {new Date(v.createdAt).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortValue: (v) => (v.usedAt ? 'used' : new Date(v.expiresAt) < new Date() ? 'expired' : 'active'),
      render: (v) => <VoucherStatusBadge voucher={v} />,
    },
    {
      key: 'wifiProfile',
      header: 'Perfil de Rede',
      sortValue: (v) => v.wifiProfile?.name ?? '',
      render: (v) => (
        <span className="rounded-md bg-surface-soft px-2.5 py-1 font-mono text-xs font-medium text-primary">
          {v.wifiProfile?.name ?? 'Padrão (Ilimitado)'}
        </span>
      ),
    },
    {
      key: 'expiresAt',
      header: 'Validade',
      sortValue: (v) => v.expiresAt,
      render: (v) => {
        const isExpired = new Date(v.expiresAt) < new Date()
        return (
          <span className={`text-xs ${isExpired ? 'text-error font-medium' : 'text-ink-muted'}`}>
            {isExpired ? 'Expirado' : `Até ${new Date(v.expiresAt).toLocaleDateString('pt-BR')}`}
          </span>
        )
      },
    },
    {
      key: 'action',
      header: '',
      align: 'right',
      render: (v) => (
        <DropdownMenu
          actions={[
            { label: 'Ver QR Code / Detalhes', icon: <QrCode size={14} />, onClick: () => setSelectedVoucher(v) },
            { label: 'Copiar código', icon: <Copy size={14} />, onClick: () => copyCode(v.code) },
            { label: 'Inativar / Revogar', icon: <Trash2 size={14} />, onClick: () => setRevokeVoucherItem(v), destructive: true },
          ]}
        />
      ),
    },
  ]

  const inputBase = 'w-full rounded-xl border border-hairline-input bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-ink-muted/50 focus:border-primary focus:ring-2 focus:ring-primary/10 h-10'

  return (
    <PageShell>
      <PageHeader
        eyebrow="Gestão de Rede"
        title="Vouchers de Visitantes"
        subtitle="Gere lotes de códigos de acesso temporário para visitantes da Fábrica."
        actions={
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <Plus size={16} />
            <span>Gerar lote de vouchers</span>
          </button>
        }
      />
      <PageBody>
        {/* Filters */}
        <div className="grid gap-3 sm:grid-cols-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar por código ou criador"
            className="sm:col-span-2"
          />
          <FormSelect
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as StatusFilter)}
            placeholder="Todos os status"
            options={[
              { value: 'all', label: 'Todos os status' },
              { value: 'active', label: 'Apenas Ativos' },
              { value: 'used', label: 'Apenas Usados' },
              { value: 'expired', label: 'Apenas Expirados' },
            ]}
          />
        </div>

        {/* Table Container */}
        <div className="mt-5 rounded-xl border border-hairline">
          {vouchers.isPending ? (
            <div className="space-y-3 p-4">{[1, 2, 3].map((row) => <SkeletonRow key={row} />)}</div>
          ) : vouchers.error ? (
            <p className="p-6 text-sm text-error">{vouchers.error.message}</p>
          ) : filtered.length === 0 ? (
            <EmptyState
              title={search || statusFilter !== 'all' ? 'Nenhum voucher encontrado' : 'Nenhum voucher gerado'}
              description={
                search || statusFilter !== 'all'
                  ? 'Ajuste os filtros de busca para visualizar outros códigos.'
                  : 'Gere um lote de vouchers para conceder acesso temporário aos visitantes.'
              }
              action={
                <button
                  onClick={() => setCreateOpen(true)}
                  className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
                >
                  Gerar lote
                </button>
              }
            />
          ) : (
            <DataTable
              rows={filtered}
              columns={columns}
              sort={sort}
              onSort={setSort}
              getRowKey={(v) => v.id}
              loading={vouchers.isFetching && !vouchers.isPending}
            />
          )}
        </div>

        {/* Drawer de gerar lote */}
        <Drawer
          open={createOpen}
          onOpenChange={setCreateOpen}
          title="Gerar lote de vouchers"
          subtitle="Os códigos gerados serão válidos para acesso no Captive Portal."
          size="lg"
          footer={
            <>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="h-9 shrink-0 rounded-full border border-hairline-input px-4 text-xs font-medium text-ink-muted transition-colors hover:border-primary hover:text-ink"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={generateBatch.isPending || !Number(count)}
                className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 text-xs font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
              >
                <Ticket size={14} />
                {generateBatch.isPending ? 'Gerando...' : 'Gerar Vouchers'}
              </button>
            </>
          }
        >
          <div className="space-y-5">
            {/* Atalhos de Predefinição */}
            <div>
              <span className="mb-2 block text-xs font-medium text-ink-muted">Predefinições rápidas</span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => applyPreset(1, 5)}
                  className="rounded-xl border border-hairline bg-surface-soft px-3 py-1.5 text-xs text-ink transition-colors hover:border-primary/40 hover:bg-surface"
                >
                  Visita Rápida (1 dia / 5 vch)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset(7, 10)}
                  className="rounded-xl border border-hairline bg-surface-soft px-3 py-1.5 text-xs text-ink transition-colors hover:border-primary/40 hover:bg-surface"
                >
                  Evento / Palestra (7 dias / 10 vch)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset(30, 20)}
                  className="rounded-xl border border-hairline bg-surface-soft px-3 py-1.5 text-xs text-ink transition-colors hover:border-primary/40 hover:bg-surface"
                >
                  Residente Temporário (30 dias / 20 vch)
                </button>
              </div>
            </div>

            <div className="space-y-4 border-t border-hairline pt-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-muted">
                  Quantidade de vouchers <span className="text-error">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={count}
                  onChange={(e) => setCount(e.target.value)}
                  placeholder="Ex: 5 ou 10"
                  className={inputBase}
                />
                <p className="mt-1 text-[11px] text-ink-muted/60">Mínimo 1, máximo 50 vouchers por lote.</p>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-muted">
                  Perfil de velocidade Wi-Fi <span className="text-ink-muted/60">(opcional)</span>
                </label>
                <FormSelect
                  value={wifiProfileId}
                  onChange={setWifiProfileId}
                  placeholder="Sem limite (Padrão)"
                  options={
                    wifiProfiles.data?.data.map((p) => ({
                      value: p.id.toString(),
                      label: `${p.name} (${p.wifiRateLimit || 'Ilimitado'})`,
                    })) ?? []
                  }
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink-muted">
                  Validade do lote <span className="text-error">*</span>
                </label>
                <FormSelect
                  value={expiresInDays}
                  onChange={setExpiresInDays}
                  placeholder="Selecione"
                  options={[
                    { value: '1', label: '1 dia' },
                    { value: '3', label: '3 dias' },
                    { value: '7', label: '7 dias (1 semana)' },
                    { value: '30', label: '30 dias (1 mês)' },
                  ]}
                />
              </div>
            </div>
          </div>
        </Drawer>

        {/* Drawer de Detalhes do Voucher */}
        <VoucherDetailDrawer
          open={!!selectedVoucher}
          onOpenChange={(v) => {
            if (!v) setSelectedVoucher(null)
          }}
          voucher={selectedVoucher}
          onRefresh={() => vouchers.refetch()}
        />

        {/* Modal confirmação de revogação */}
        {revokeVoucherItem && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center">
            <div className="absolute inset-0 bg-ink/35 backdrop-blur-[2px]" onClick={() => setRevokeVoucherItem(null)} />
            <div className="relative z-10 w-[calc(100%-2rem)] max-w-md rounded-3xl border border-hairline bg-surface p-6 shadow-2xl animate-[fadeUp_0.15s_ease-out]">
              <h2 className="text-lg font-medium tracking-tight text-ink">Inativar / Revogar voucher?</h2>
              <p className="mt-2 text-xs leading-relaxed text-ink-muted">
                O código <strong className="font-mono text-primary">{formatVoucherCode(revokeVoucherItem.code)}</strong> será inativado e o acesso Wi-Fi usando este voucher será cortado.
              </p>
              <div className="mt-6 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setRevokeVoucherItem(null)}
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
                  {revokeVoucher.isPending ? 'Inativando...' : 'Inativar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </PageBody>
      <PageFooter>{filtered.length} voucher(s) exibido(s)</PageFooter>
    </PageShell>
  )
}
