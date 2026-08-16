import { useState } from 'react'
import { ChevronLeft, ChevronRight, Wifi } from 'lucide-react'
import { useOnlinePresence, usePresenceHistory, type PresenceSession } from '../hooks/use-presence.js'
import { DataTable, type Column, type SortState } from '../components/data-table.js'
import { EmptyState, SkeletonRow } from '../components/feedback.js'
import { PageBody, PageFooter, PageHeader, PageShell } from '../components/page.js'

const columns: Column<PresenceSession>[] = [
  { key: 'user', header: 'Membro', sortValue: (row) => row.name ?? row.username, render: (row) => <div><p className="text-sm text-ink">{row.name ?? row.username}</p><p className="text-xs text-ink-muted">{row.username}</p></div> },
  { key: 'ip', header: 'IP / MAC', sortValue: (row) => row.ip ?? '', render: (row) => <div className="font-mono text-xs text-ink-muted"><p>{row.ip ?? '—'}</p><p>{row.mac ?? '—'}</p></div> },
  { key: 'start', header: 'Início', sortValue: (row) => row.startedAt ?? '', render: (row) => <span className="text-sm text-ink-muted">{formatDate(row.startedAt)}</span> },
  { key: 'duration', header: 'Duração', numeric: true, sortValue: (row) => duration(row), render: (row) => <span className="text-sm tabular-nums text-ink-muted">{formatDuration(duration(row))}</span> },
  { key: 'traffic', header: 'Tráfego', numeric: true, sortValue: (row) => bytes(row.inputBytes) + bytes(row.outputBytes), render: (row) => <span className="text-sm tabular-nums text-ink-muted">{formatBytes(bytes(row.inputBytes) + bytes(row.outputBytes))}</span> },
]

export function PresencePage() {
  const [tab, setTab] = useState<'online' | 'history'>('online')
  const [sort, setSort] = useState<SortState>({ key: 'start', direction: 'desc' })
  const [username, setUsername] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)
  const online = useOnlinePresence()
  const history = usePresenceHistory({ page, username, from, to, limit: 20 })
  const query = tab === 'online' ? online : history
  const totalPages = Math.max(1, Math.ceil((history.data?.total ?? 0) / 20))

  function updateFilter(action: () => void) {
    action()
    setPage(1)
  }

  return <PageShell><PageHeader eyebrow="Rede" title="Presença Wi-Fi" subtitle="Sessões do FreeRADIUS e histórico de conexões." actions={<div className="flex rounded-full border border-hairline-input p-1"><button onClick={() => setTab('online')} className={`rounded-full px-4 py-1.5 text-sm ${tab === 'online' ? 'bg-primary text-white' : 'text-ink-muted'}`}>Online</button><button onClick={() => setTab('history')} className={`rounded-full px-4 py-1.5 text-sm ${tab === 'history' ? 'bg-primary text-white' : 'text-ink-muted'}`}>Histórico</button></div>} /><PageBody>
    {tab === 'history' && <div className="mb-5 grid gap-3 sm:grid-cols-3"><input value={username} onChange={(event) => updateFilter(() => setUsername(event.target.value))} placeholder="Email do membro" className="rounded-lg border border-hairline-input px-3 py-2.5 text-sm outline-none focus:border-primary" /><input type="date" value={from} onChange={(event) => updateFilter(() => setFrom(event.target.value))} className="rounded-lg border border-hairline-input px-3 py-2.5 text-sm text-ink-muted outline-none focus:border-primary" /><input type="date" value={to} onChange={(event) => updateFilter(() => setTo(event.target.value))} className="rounded-lg border border-hairline-input px-3 py-2.5 text-sm text-ink-muted outline-none focus:border-primary" /></div>}
    <div className="overflow-hidden rounded-xl border border-hairline">{query.isPending ? <div className="space-y-3 p-4">{[1, 2, 3].map((row) => <SkeletonRow key={row} />)}</div> : query.error ? <p className="p-6 text-sm text-error">{query.error.message}</p> : query.data.data.length === 0 ? <EmptyState title={tab === 'online' ? 'Ninguém online agora' : 'Nenhuma conexão encontrada'} description={tab === 'online' ? 'As sessões aparecerão aqui quando o MikroTik enviar accounting ao FreeRADIUS.' : 'Ajuste os filtros para consultar outro período.'} action={<Wifi className="mx-auto text-primary" size={22} />} /> : <DataTable rows={query.data.data} columns={columns} sort={sort} onSort={setSort} getRowKey={(row) => String(row.id)} />}</div>
  </PageBody><PageFooter>{tab === 'online' ? `${online.data?.data.length ?? 0} sessão(ões) online · atualização a cada 30s` : <div className="flex items-center justify-between gap-4"><span>{history.data?.total ?? 0} conexão(ões)</span><div className="flex items-center gap-2"><button onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1} className="rounded-lg border border-hairline-input p-1.5 disabled:opacity-40" aria-label="Página anterior"><ChevronLeft size={15} /></button><span className="tabular-nums">{page} / {totalPages}</span><button onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page === totalPages} className="rounded-lg border border-hairline-input p-1.5 disabled:opacity-40" aria-label="Próxima página"><ChevronRight size={15} /></button></div></div>}</PageFooter></PageShell>
}

function duration(row: PresenceSession) { return row.durationSeconds ?? (row.startedAt ? Math.max(0, Math.floor((Date.now() - new Date(row.startedAt).getTime()) / 1000)) : 0) }
function bytes(value: string | null) { return Number(value ?? 0) }
function formatDate(value: string | null) { return value ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '—' }
function formatDuration(seconds: number) { const hours = Math.floor(seconds / 3600); const minutes = Math.floor((seconds % 3600) / 60); return hours ? `${hours}h ${minutes}min` : `${minutes}min` }
function formatBytes(value: number) { if (value < 1024 ** 2) return `${(value / 1024).toFixed(1)} KB`; if (value < 1024 ** 3) return `${(value / 1024 ** 2).toFixed(1)} MB`; return `${(value / 1024 ** 3).toFixed(1)} GB` }
