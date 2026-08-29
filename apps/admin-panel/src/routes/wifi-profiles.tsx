import { useState } from 'react'
import { Eye, Pencil, Plus } from 'lucide-react'
import { useCreateWifiProfile, useWifiProfiles } from '../hooks/use-members.js'
import type { WifiProfile } from '../lib/api.js'
import { DataTable, type Column, type SortState } from '../components/data-table.js'
import { DropdownMenu } from '../components/dropdown-menu.js'
import { Drawer } from '../components/drawer.js'
import { EmptyState, SkeletonRow } from '../components/feedback.js'
import { FormSelect } from '../components/form-select.js'
import { PageBody, PageFooter, PageHeader, PageShell } from '../components/page.js'
import { SearchInput } from '../components/search-input.js'
import { WifiProfileDetailDrawer } from '../components/wifi-profile-detail-drawer.js'
import {
  SPEED_PRESETS, TIMEOUT_PRESETS,
  buildSpeedValue, buildTimeoutValue,
  formatTimeoutLong,
} from '../lib/wifi-presets.js'

export function WifiProfilesPage() {
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortState>({ key: 'name', direction: 'asc' })
  const [selectedProfile, setSelectedProfile] = useState<WifiProfile | null>(null)
  const [selectedEdit, setSelectedEdit] = useState(false)

  const profiles = useWifiProfiles()
  const createProfile = useCreateWifiProfile()

  // Create drawer
  const [createOpen, setCreateOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [speedPreset, setSpeedPreset] = useState('')
  const [customDown, setCustomDown] = useState('')
  const [customUp, setCustomUp] = useState('')
  const [timeoutPreset, setTimeoutPreset] = useState('604800')
  const [customDays, setCustomDays] = useState('')
  const [customHours, setCustomHours] = useState('')
  const [customMinutes, setCustomMinutes] = useState('')

  function resetCreateForm() {
    setName('')
    setDescription('')
    setSpeedPreset('')
    setCustomDown('')
    setCustomUp('')
    setTimeoutPreset('604800')
    setCustomDays('')
    setCustomHours('')
    setCustomMinutes('')
  }

  async function handleCreate() {
    if (!name.trim()) return
    await createProfile.mutateAsync({
      name: name.trim(),
      description: description.trim() || null,
      wifiRateLimit: buildSpeedValue(speedPreset, customDown, customUp),
      wifiSessionTimeout: buildTimeoutValue(timeoutPreset, customDays, customHours, customMinutes),
    })
    resetCreateForm()
    setCreateOpen(false)
  }

  function openProfile(profile: WifiProfile, edit = false) {
    setSelectedProfile(profile)
    setSelectedEdit(edit)
  }

  const filtered = profiles.data?.data.filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase())
  ) ?? []

  const columns: Column<WifiProfile>[] = [
    { key: 'name', header: 'Perfil', sortValue: (p) => p.name, render: (p) => (
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
          {p.name[0]}
        </div>
        <div className="min-w-0">
          <p className="text-sm text-ink">{p.name}</p>
          <p className="mt-0.5 truncate text-xs text-ink-muted">{p.description || 'Sem descrição'}</p>
        </div>
      </div>
    )},
    { key: 'rateLimit', header: 'Velocidade', sortValue: (p) => p.wifiRateLimit ?? '', render: (p) => <span className="rounded-md bg-surface-soft px-2 py-0.5 font-mono text-xs text-primary">{p.wifiRateLimit || 'Ilimitado'}</span> },
    { key: 'sessionTimeout', header: 'Sessão máxima', sortValue: (p) => p.wifiSessionTimeout ?? 0, numeric: true, render: (p) => <span className="text-sm text-ink-muted">{formatTimeoutLong(p.wifiSessionTimeout)}</span> },
    { key: 'action', header: '', align: 'right', render: (p) => (
      <DropdownMenu actions={[
        { label: 'Ver detalhes', icon: <Eye size={14} />, onClick: () => openProfile(p, false) },
        { label: 'Editar', icon: <Pencil size={14} />, onClick: () => openProfile(p, true) },
      ]} />
    )},
  ]

  const inputBase = 'w-full rounded-lg border border-hairline-input bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-ink-muted/50 focus:border-primary h-9'

  return (
    <PageShell>
      <PageHeader
        eyebrow="Gestão de Rede"
        title="Perfis de Rede Wi-Fi"
        subtitle="Regras de banda e limite de tempo aplicadas no MikroTik / FreeRADIUS."
        actions={
          <button onClick={() => setCreateOpen(true)} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-normal text-white hover:bg-primary-hover transition-colors">
            <Plus size={16} />
            <span>Novo perfil</span>
          </button>
        }
      />
      <PageBody>
        <div className="grid gap-3 sm:grid-cols-2">
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nome ou descrição" />
        </div>

        <div className="mt-5 rounded-xl border border-hairline">
          {profiles.isPending ? (
            <div className="space-y-3 p-4">{[1, 2, 3].map((row) => <SkeletonRow key={row} />)}</div>
          ) : profiles.error ? (
            <p className="p-6 text-sm text-error">{profiles.error.message}</p>
          ) : filtered.length === 0 ? (
            <EmptyState
              title="Nenhum perfil cadastrado"
              description="Crie um perfil para definir velocidades e limites de tempo Wi-Fi."
              action={<button onClick={() => setCreateOpen(true)} className="rounded-full bg-primary px-4 py-2 text-sm text-white">Novo perfil</button>}
            />
          ) : (
            <DataTable rows={filtered} columns={columns} sort={sort} onSort={setSort} getRowKey={(p) => String(p.id)} loading={profiles.isFetching && !profiles.isPending} />
          )}
        </div>

        {/* Drawer criar perfil */}
        <Drawer
          open={createOpen}
          onOpenChange={(v) => { if (!v) resetCreateForm(); setCreateOpen(v) }}
          title="Novo perfil de rede"
          subtitle="Defina as regras de banda e limite de tempo."
          size="lg"
          footer={
            <>
              <button type="button" onClick={() => setCreateOpen(false)} className="h-9 shrink-0 rounded-full border border-hairline-input px-4 text-sm text-ink-muted transition-colors hover:border-primary hover:text-ink">
                Cancelar
              </button>
              <button type="button" onClick={handleCreate} disabled={createProfile.isPending || !name.trim()} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50">
                {createProfile.isPending ? 'Salvando...' : 'Criar perfil'}
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <FormField label="Nome do perfil" required>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Padrão 20M, Visitante 5M" className={inputBase} />
            </FormField>

            <FormField label="Descrição" optional>
              <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrição do plano" className={inputBase} />
            </FormField>

            <FormField label="Limite de velocidade" optional>
              <FormSelect value={speedPreset} onChange={setSpeedPreset} placeholder="Selecione" options={SPEED_PRESETS.map((p) => ({ value: p.value, label: p.label }))} />
            </FormField>
            {speedPreset === '__custom__' && (
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Download" optional>
                  <div className="relative">
                    <input type="text" value={customDown} onChange={(e) => setCustomDown(e.target.value)} placeholder="Ex: 20" className={`${inputBase} pr-7`} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-muted/50">Mbps</span>
                  </div>
                </FormField>
                <FormField label="Upload" optional>
                  <div className="relative">
                    <input type="text" value={customUp} onChange={(e) => setCustomUp(e.target.value)} placeholder="Ex: 10" className={`${inputBase} pr-7`} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-muted/50">Mbps</span>
                  </div>
                </FormField>
              </div>
            )}

            <FormField label="Duração máxima da sessão" optional>
              <FormSelect value={timeoutPreset} onChange={setTimeoutPreset} placeholder="Selecione" options={TIMEOUT_PRESETS.map((p) => ({ value: p.value, label: p.label }))} />
            </FormField>
            {timeoutPreset === '__custom__' && (
              <div className="grid grid-cols-3 gap-3">
                <FormField label="Dias" optional>
                  <input type="number" min="0" value={customDays} onChange={(e) => setCustomDays(e.target.value)} placeholder="0" className={inputBase} />
                </FormField>
                <FormField label="Horas" optional>
                  <input type="number" min="0" max="23" value={customHours} onChange={(e) => setCustomHours(e.target.value)} placeholder="0" className={inputBase} />
                </FormField>
                <FormField label="Minutos" optional>
                  <input type="number" min="0" max="59" value={customMinutes} onChange={(e) => setCustomMinutes(e.target.value)} placeholder="0" className={inputBase} />
                </FormField>
              </div>
            )}

            {createProfile.error && <p className="text-xs text-error">{createProfile.error.message}</p>}
          </div>
        </Drawer>

        <WifiProfileDetailDrawer
          open={!!selectedProfile}
          onOpenChange={(v) => { if (!v) setSelectedProfile(null) }}
          profile={selectedProfile}
          defaultEdit={selectedEdit}
          onRefresh={() => profiles.refetch()}
        />
      </PageBody>
      <PageFooter>{filtered.length} perfil(is) de rede cadastrado(s)</PageFooter>
    </PageShell>
  )
}

function FormField({ label, required, optional, children }: { label: string; required?: boolean; optional?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs text-ink-muted">
        {label} {required && <span className="text-red-500">*</span>}
        {optional && <span className="text-ink-muted/60">(opcional)</span>}
      </label>
      {children}
    </div>
  )
}
