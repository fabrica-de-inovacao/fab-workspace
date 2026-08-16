import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMembers, useRoles } from '../hooks/use-members.js'
import { useOnlinePresence } from '../hooks/use-presence.js'
import type { Member } from '../lib/api.js'
import { DataTable, type Column, type SortState } from '../components/data-table.js'
import { EmptyState, SkeletonRow, StatusBadge } from '../components/feedback.js'
import { PageBody, PageFooter, PageHeader, PageShell } from '../components/page.js'

const PAGE_SIZE = 20

export function MembersPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'' | 'active' | 'inactive'>('')
  const [roleId, setRoleId] = useState('')
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<SortState>({ key: 'name', direction: 'asc' })
  const roles = useRoles()
  const online = useOnlinePresence()
  const members = useMembers({ search, page, limit: PAGE_SIZE, ...(status && { status }), ...(roleId && { roleId: Number(roleId) }) })
  const onlineUsernames = new Set(online.data?.data.map((session) => session.username.toLowerCase()))

  function updateFilter(action: () => void) {
    action()
    setPage(1)
  }

  const columns: Column<Member>[] = [
    { key: 'name', header: 'Membro', sortValue: (member) => member.name, render: (member) => <div><p className="text-sm text-ink">{member.name}</p><p className="mt-0.5 text-xs text-ink-muted">{member.email}</p></div> },
    { key: 'cpf', header: 'CPF', sortValue: (member) => member.cpf ?? '', numeric: true, render: (member) => <span className="text-sm text-ink-muted">{formatCpf(member.cpf)}</span> },
    { key: 'role', header: 'Perfil', sortValue: (member) => member.userRoles[0]?.role.name ?? '', render: (member) => <span className="rounded-full bg-primary-soft px-2.5 py-1 text-xs text-primary">{member.userRoles[0]?.role.name ?? 'Sem perfil'}</span> },
    { key: 'status', header: 'Status', sortValue: (member) => Number(member.active), render: (member) => <div className="flex flex-wrap gap-2"><StatusBadge active={member.active} />{onlineUsernames.has(member.email.toLowerCase()) && <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary-soft px-2.5 py-1 text-xs text-secondary-700"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-secondary-700" />Online</span>}</div> },
    { key: 'action', header: 'Ação', align: 'right', render: (member) => <Link to="/members/$memberId" params={{ memberId: member.id }} className="text-sm text-primary hover:text-primary-hover">Ver perfil</Link> },
  ]

  const totalPages = Math.max(1, Math.ceil((members.data?.total ?? 0) / PAGE_SIZE))

  return <PageShell>
    <PageHeader eyebrow="Gestão" title="Membros" subtitle="Cadastros e acesso à rede da Fábrica." actions={<div className="flex gap-3"><Link to="/roles" className="rounded-full border border-hairline-input px-4 py-2.5 text-sm text-ink-muted hover:border-primary hover:text-primary">Perfis</Link><Link to="/members/new" className="rounded-full bg-primary px-4 py-2.5 text-sm font-normal text-white hover:bg-primary-hover">Novo membro</Link></div>} />
    <PageBody>
      <div className="grid gap-3 sm:grid-cols-[minmax(220px,1fr)_180px_180px]">
        <input value={search} onChange={(event) => updateFilter(() => setSearch(event.target.value))} placeholder="Buscar por nome ou email" className="rounded-lg border border-hairline-input px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
        <select value={status} onChange={(event) => updateFilter(() => setStatus(event.target.value as typeof status))} className="rounded-lg border border-hairline-input bg-surface px-3 py-2.5 text-sm text-ink-muted outline-none focus:border-primary"><option value="">Todos os status</option><option value="active">Ativos</option><option value="inactive">Inativos</option></select>
        <select value={roleId} onChange={(event) => updateFilter(() => setRoleId(event.target.value))} className="rounded-lg border border-hairline-input bg-surface px-3 py-2.5 text-sm text-ink-muted outline-none focus:border-primary"><option value="">Todos os perfis</option>{roles.data?.data.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select>
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-hairline">
        {members.isPending ? <div className="space-y-3 p-4">{[1, 2, 3, 4].map((row) => <SkeletonRow key={row} />)}</div> : members.error ? <p className="p-6 text-sm text-error">{members.error.message}</p> : members.data.data.length === 0 ? <EmptyState title="Nenhum membro encontrado" description="Ajuste os filtros ou cadastre um novo membro para provisionar o acesso Wi-Fi." action={<Link to="/members/new" className="rounded-full bg-primary px-4 py-2 text-sm text-white">Novo membro</Link>} /> : <DataTable rows={members.data.data} columns={columns} sort={sort} onSort={setSort} getRowKey={(member) => member.id} />}
      </div>
    </PageBody>
    <PageFooter><div className="flex items-center justify-between gap-4"><span>{members.data ? `${members.data.total} membro(s)` : 'Carregando membros'}</span><div className="flex items-center gap-2"><button onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1} className="rounded-lg border border-hairline-input p-1.5 disabled:opacity-40" aria-label="Página anterior"><ChevronLeft size={15} /></button><span className="tabular-nums">{page} / {totalPages}</span><button onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page === totalPages} className="rounded-lg border border-hairline-input p-1.5 disabled:opacity-40" aria-label="Próxima página"><ChevronRight size={15} /></button></div></div></PageFooter>
  </PageShell>
}

function formatCpf(cpf: string | null) {
  return cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') ?? '—'
}
