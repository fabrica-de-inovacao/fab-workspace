import { useState } from 'react'
import { Plus, Sliders } from 'lucide-react'
import { useCreateWifiProfile, useWifiProfiles } from '../hooks/use-members.js'
import type { WifiProfile } from '../lib/api.js'
import { DataTable, type Column, type SortState } from '../components/data-table.js'
import { EmptyState, SkeletonRow } from '../components/feedback.js'
import { PageBody, PageFooter, PageHeader, PageShell } from '../components/page.js'

const columns: Column<WifiProfile>[] = [
  { key: 'name', header: 'Perfil de Rede', sortValue: (row) => row.name, render: (row) => <div><p className="text-sm font-normal text-ink">{row.name}</p><p className="text-xs text-ink-muted">{row.description || 'Sem descrição'}</p></div> },
  { key: 'rateLimit', header: 'Limite de Velocidade', sortValue: (row) => row.wifiRateLimit ?? '', render: (row) => <span className="font-mono text-xs text-primary">{row.wifiRateLimit || 'Sem limite (Ilimitado)'}</span> },
  { key: 'sessionTimeout', header: 'Timeout de Sessão', sortValue: (row) => row.wifiSessionTimeout ?? 0, numeric: true, render: (row) => <span className="text-sm text-ink-muted">{formatTimeout(row.wifiSessionTimeout)}</span> },
]

export function WifiProfilesPage() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [wifiRateLimit, setWifiRateLimit] = useState('')
  const [wifiSessionTimeout, setWifiSessionTimeout] = useState('')
  const [sort, setSort] = useState<SortState>({ key: 'name', direction: 'asc' })

  const profiles = useWifiProfiles()
  const createProfile = useCreateWifiProfile()

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    await createProfile.mutateAsync({
      name,
      description: description || null,
      wifiRateLimit: wifiRateLimit || null,
      wifiSessionTimeout: wifiSessionTimeout ? Number(wifiSessionTimeout) : null,
    })
    setName('')
    setDescription('')
    setWifiRateLimit('')
    setWifiSessionTimeout('')
    setOpen(false)
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="Gestão de Rede"
        title="Perfis de Rede Wi-Fi"
        subtitle="Regras de banda e limite de tempo aplicadas no MikroTik / FreeRADIUS."
        actions={
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm text-white hover:bg-primary-hover transition-colors"
          >
            <Plus size={16} />
            <span>Novo perfil de rede</span>
          </button>
        }
      />
      <PageBody>
        {open && (
          <form onSubmit={handleCreate} className="mb-6 rounded-xl border border-hairline bg-surface p-5 shadow-sm space-y-4">
            <h3 className="text-base font-normal text-ink">Criar perfil de rede</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-normal text-ink-muted mb-1">Nome do perfil</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Padrão 20M, Visitante 5M"
                  required
                  className="w-full rounded-lg border border-hairline-input px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-normal text-ink-muted mb-1">Limite de velocidade (Rx/Tx)</label>
                <input
                  value={wifiRateLimit}
                  onChange={(e) => setWifiRateLimit(e.target.value)}
                  placeholder="Ex: 20M/20M ou 10M/5M"
                  className="w-full rounded-lg border border-hairline-input px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-normal text-ink-muted mb-1">Timeout de sessão (em segundos)</label>
                <input
                  type="number"
                  value={wifiSessionTimeout}
                  onChange={(e) => setWifiSessionTimeout(e.target.value)}
                  placeholder="Ex: 7200 (2 horas) ou deixe vazio"
                  className="w-full rounded-lg border border-hairline-input px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-normal text-ink-muted mb-1">Descrição</label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descrição opcional do plano"
                  className="w-full rounded-lg border border-hairline-input px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>
            </div>
            {createProfile.error && <p className="text-xs text-error">{createProfile.error.message}</p>}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-hairline-input px-4 py-2 text-xs text-ink-muted hover:border-primary"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={createProfile.isPending}
                className="rounded-full bg-primary px-4 py-2 text-xs text-white hover:bg-primary-hover disabled:opacity-50"
              >
                {createProfile.isPending ? 'Salvando...' : 'Salvar perfil'}
              </button>
            </div>
          </form>
        )}

        <div className="rounded-xl border border-hairline">
          {profiles.isPending ? (
            <div className="space-y-3 p-4">
              {[1, 2, 3].map((row) => (
                <SkeletonRow key={row} />
              ))}
            </div>
          ) : profiles.error ? (
            <p className="p-6 text-sm text-error">{profiles.error.message}</p>
          ) : profiles.data.data.length === 0 ? (
            <EmptyState
              title="Nenhum perfil de rede cadastrado"
              description="Crie um perfil para definir velocidades e limites de tempo Wi-Fi para os membros."
              action={
                <button onClick={() => setOpen(true)} className="rounded-full bg-primary px-4 py-2 text-sm text-white">
                  Novo perfil de rede
                </button>
              }
            />
          ) : (
            <DataTable rows={profiles.data.data} columns={columns} sort={sort} onSort={setSort} getRowKey={(row) => String(row.id)} />
          )}
        </div>
      </PageBody>
      <PageFooter>{profiles.data?.data.length ?? 0} perfil(is) de rede Wi-Fi cadastrado(s)</PageFooter>
    </PageShell>
  )
}

function formatTimeout(seconds: number | null) {
  if (!seconds) return 'Sem limite'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours && minutes) return `${hours}h ${minutes}min (${seconds}s)`
  if (hours) return `${hours}h (${seconds}s)`
  return `${minutes}min (${seconds}s)`
}
