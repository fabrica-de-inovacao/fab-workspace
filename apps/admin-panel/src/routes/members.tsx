import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Eye, Pencil, Plus, ShieldOff, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { useMembers, useMemberStatus, useRoles, useWifiProfiles } from '../hooks/use-members.js'
import { useOnlinePresence } from '../hooks/use-presence.js'
import type { Member } from '../lib/api.js'
import { ConfirmDialog } from '../components/confirm-dialog.js'
import { DataTable, type Column, type SortState } from '../components/data-table.js'
import { DropdownMenu } from '../components/dropdown-menu.js'
import { EmptyState, SkeletonRow, StatusBadge } from '../components/feedback.js'
import { FormSelect } from '../components/form-select.js'
import { MemberDetailDrawer } from '../components/member-detail-drawer.js'
import { SearchInput } from '../components/search-input.js'
import { PageBody, PageFooter, PageHeader, PageShell } from '../components/page.js'
import { NewMemberDrawer } from '../components/new-member-drawer.js'

const PAGE_SIZE = 20

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administração',
  coordenador: 'Coordenação',
  membro: 'Membro',
}

function translateRole(name: string | undefined) {
  if (!name) return 'Sem perfil'
  return ROLE_LABELS[name] ?? name
}

function formatCpf(cpf: string | null) {
  return cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') ?? '—'
}

export function MembersPage() {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'' | 'active' | 'inactive'>('')
  const [roleId, setRoleId] = useState('')
  const [wifiProfileId, setWifiProfileId] = useState('')
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<SortState>({ key: 'name', direction: 'asc' })
  const [newMemberOpen, setNewMemberOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [selectedEdit, setSelectedEdit] = useState(false)
  const [confirmBlock, setConfirmBlock] = useState<Member | null>(null)

  const roles = useRoles()
  const wifiProfiles = useWifiProfiles()
  const online = useOnlinePresence()
  const members = useMembers({ search, page, limit: PAGE_SIZE, ...(status && { status }), ...(roleId && { roleId: Number(roleId) }), ...(wifiProfileId && { wifiProfileId: Number(wifiProfileId) }) })
  const onlineUsernames = new Set(online.data?.data.filter((session) => session.status === 'online').map((session) => session.username.toLowerCase()))

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 300)
    return () => window.clearTimeout(timeout)
  }, [searchInput])

  // Mutation de bloquear/reativar
  const blockMember = useMemberStatus(confirmBlock?.id ?? '', confirmBlock?.active ?? true)

  async function handleConfirmBlock() {
    if (!confirmBlock) return
    try {
      await blockMember.mutateAsync()
      toast.success(confirmBlock.active ? 'Membro inativado' : 'Membro reativado')
      setConfirmBlock(null)
      members.refetch()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao alterar status')
    }
  }

  function updateFilter(action: () => void) {
    action()
    setPage(1)
  }

  function openMember(member: Member, edit = false) {
    setSelectedMember(member)
    setSelectedEdit(edit)
  }

  const columns: Column<Member>[] = [
    { key: 'name', header: 'Membro', sortValue: (m) => m.name, render: (m) => (
      <div className="flex items-center gap-3">
        {m.image ? (
          <img src={m.image} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
        ) : (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs text-primary">
            {m.name[0]}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm text-ink">{m.name}</p>
          <p className="mt-0.5 truncate text-xs text-ink-muted">{m.email}</p>
        </div>
      </div>
    )},
    { key: 'cpf', header: 'CPF', sortValue: (m) => m.cpf ?? '', numeric: true, render: (m) => <span className="text-sm text-ink-muted">{formatCpf(m.cpf)}</span> },
    { key: 'role', header: 'Perfil de Acesso', sortValue: (m) => m.userRoles[0]?.role.name ?? '', render: (m) => <span className="rounded-full bg-primary-soft px-2.5 py-1 text-xs text-primary">{translateRole(m.userRoles[0]?.role.name)}</span> },
    { key: 'wifiProfile', header: 'Perfil de Rede', sortValue: (m) => m.wifiProfile?.name ?? '', render: (m) => <span className="text-xs font-mono text-ink-muted">{m.wifiProfile?.name ?? 'Padrão (Ilimitado)'}</span> },
    { key: 'status', header: 'Status', sortValue: (m) => Number(m.active), render: (m) => <div className="flex flex-wrap gap-2"><StatusBadge active={m.active} />{onlineUsernames.has(m.email.toLowerCase()) && <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary-soft px-2.5 py-1 text-xs text-secondary-700"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-secondary-700" />Online</span>}</div> },
    { key: 'action', header: '', align: 'right', render: (m) => (
      <DropdownMenu actions={[
        { label: 'Ver perfil', icon: <Eye size={14} />, onClick: () => openMember(m, false) },
        { label: 'Editar', icon: <Pencil size={14} />, onClick: () => openMember(m, true) },
        {
          label: m.active ? 'Bloquear acesso' : 'Reativar acesso',
          icon: m.active ? <ShieldOff size={14} /> : <ShieldCheck size={14} />,
          onClick: () => setConfirmBlock(m),
          destructive: m.active,
        },
      ]} />
    )},
  ]

  const totalPages = Math.max(1, Math.ceil((members.data?.total ?? 0) / PAGE_SIZE))

  return <PageShell>
    <PageHeader
      eyebrow="Gestão de Membros"
      title="Membros"
      subtitle="Cadastros e acessos da Fábrica."
      actions={
        <button
          onClick={() => setNewMemberOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-normal text-white hover:bg-primary-hover transition-colors"
        >
          <Plus size={16} />
          <span>Novo membro</span>
        </button>
      }
    />
    <PageBody>
      <div className="grid gap-3 sm:grid-cols-4">
        <SearchInput
          value={searchInput}
          onChange={setSearchInput}
          placeholder="Buscar por nome ou email"
        />
        <FormSelect
          value={status}
          onChange={(v) => updateFilter(() => setStatus(v as typeof status))}
          placeholder="Todos os status"
          options={[
            { value: '', label: 'Todos os status' },
            { value: 'active', label: 'Ativos' },
            { value: 'inactive', label: 'Inativos' },
          ]}
        />
        <FormSelect
          value={roleId}
          onChange={(v) => updateFilter(() => setRoleId(v))}
          placeholder="Todos os perfis de acesso"
          options={[
            { value: '', label: 'Todos os perfis de acesso' },
            ...(roles.data?.data.map((r) => ({ value: r.id.toString(), label: r.name })) ?? []),
          ]}
        />
        <FormSelect
          value={wifiProfileId}
          onChange={(v) => updateFilter(() => setWifiProfileId(v))}
          placeholder="Todos os perfis de rede"
          options={[
            { value: '', label: 'Todos os perfis de rede' },
            ...(wifiProfiles.data?.data.map((p) => ({ value: p.id.toString(), label: p.name })) ?? []),
          ]}
        />
      </div>

      <div className="mt-5 rounded-xl border border-hairline">
        {members.isPending ? <div className="space-y-3 p-4">{[1, 2, 3, 4].map((row) => <SkeletonRow key={row} />)}</div> : members.error ? <p className="p-6 text-sm text-error">{members.error.message}</p> : members.data.data.length === 0 ? <EmptyState title="Nenhum membro encontrado" description="Ajuste os filtros ou cadastre um novo membro para provisionar o acesso Wi-Fi." action={<button onClick={() => setNewMemberOpen(true)} className="rounded-full bg-primary px-4 py-2 text-sm text-white">Novo membro</button>} /> : <DataTable rows={members.data.data} columns={columns} sort={sort} onSort={setSort} getRowKey={(m) => m.id} loading={members.isFetching && !members.isPending} />}
      </div>

      <NewMemberDrawer open={newMemberOpen} onOpenChange={setNewMemberOpen} />
      <MemberDetailDrawer
        open={!!selectedMember}
        onOpenChange={(v) => { if (!v) setSelectedMember(null) }}
        member={selectedMember}
        defaultEdit={selectedEdit}
        onRefresh={() => members.refetch()}
      />

      {/* Confirmação de bloqueio/reativação */}
      <ConfirmBlockDialog
        member={confirmBlock}
        onConfirm={handleConfirmBlock}
        onCancel={() => setConfirmBlock(null)}
        loading={blockMember.isPending}
      />
    </PageBody>
    <PageFooter><div className="flex items-center justify-between gap-4"><span>{members.data ? `${members.data.total} membro(s)` : 'Carregando membros'}</span><div className="flex items-center gap-2"><button onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1} className="rounded-lg border border-hairline-input p-1.5 disabled:opacity-40" aria-label="Página anterior"><ChevronLeft size={15} /></button><span className="tabular-nums">{page} / {totalPages}</span><button onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page === totalPages} className="rounded-lg border border-hairline-input p-1.5 disabled:opacity-40" aria-label="Próxima página"><ChevronRight size={15} /></button></div></div></PageFooter>
  </PageShell>
}

function ConfirmBlockDialog({ member, onConfirm, onCancel, loading }: { member: Member | null; onConfirm: () => void; onCancel: () => void; loading: boolean }) {
  if (!member) return null
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      <div className="absolute inset-0 bg-ink/35 backdrop-blur-[2px]" onClick={onCancel} />
      <div className="relative z-10 w-[calc(100%-2rem)] max-w-md rounded-2xl border border-hairline bg-surface p-6 shadow-2xl">
        <h2 className="text-xl font-light tracking-tight text-ink">
          {member.active ? 'Bloquear acesso?' : 'Reativar acesso?'}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          {member.active
            ? `O acesso Wi-Fi de ${member.name} será revogado imediatamente. O cadastro continuará disponível para reativação.`
            : `Deseja reativar o acesso Wi-Fi de ${member.name}?`}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-hairline-input px-4 py-2 text-sm text-ink-muted"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`rounded-full px-4 py-2 text-sm text-white disabled:opacity-60 ${
              member.active ? 'bg-error hover:bg-error/90' : 'bg-primary hover:bg-primary-hover'
            }`}
          >
            {loading ? 'Processando...' : member.active ? 'Bloquear' : 'Reativar'}
          </button>
        </div>
      </div>
    </div>
  )
}
