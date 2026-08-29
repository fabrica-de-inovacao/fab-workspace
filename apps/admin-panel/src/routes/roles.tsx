import { useState } from 'react'
import { Plus, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { useCreateRole, useRoles } from '../hooks/use-members.js'
import type { Role } from '../lib/api.js'
import { DataTable, type Column, type SortState } from '../components/data-table.js'
import { Drawer } from '../components/drawer.js'
import { EmptyState, SkeletonRow } from '../components/feedback.js'
import { PageBody, PageFooter, PageHeader, PageShell } from '../components/page.js'
import { SearchInput } from '../components/search-input.js'

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  coordenador: 'Coordenador',
  membro: 'Membro',
}

const ROLE_ACCESS: Record<string, string> = {
  admin: 'Acesso total ao painel e à gestão de perfis.',
  coordenador: 'Gestão de membros, rede, vouchers e presença.',
  membro: 'Sem acesso às áreas administrativas.',
}

function roleLabel(name: string) {
  return ROLE_LABELS[name] ?? name
}

function roleScope(name: string) {
  if (name === 'admin') return 'Acesso total'
  if (name === 'coordenador') return 'Gestão'
  return 'Sem permissão'
}

export function RolesPage() {
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortState>({ key: 'name', direction: 'asc' })
  const [createOpen, setCreateOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [formError, setFormError] = useState('')

  const roles = useRoles()
  const createRole = useCreateRole()
  const roleList = roles.data?.data ?? []
  const filtered = roleList.filter((role) => {
    const term = search.trim().toLowerCase()
    return !term || roleLabel(role.name).toLowerCase().includes(term) || role.name.toLowerCase().includes(term) || role.description?.toLowerCase().includes(term)
  })

  function resetCreateForm() {
    setName('')
    setDescription('')
    setFormError('')
  }

  async function handleCreate() {
    const trimmedName = name.trim()
    const trimmedDescription = description.trim()

    setFormError('')
    if (trimmedName.length < 2 || trimmedName.length > 64) {
      setFormError('O identificador deve ter entre 2 e 64 caracteres.')
      return
    }

    try {
      await createRole.mutateAsync({
        name: trimmedName,
        description: trimmedDescription || null,
      })
      toast.success('Perfil de acesso criado')
      resetCreateForm()
      setCreateOpen(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao criar perfil de acesso'
      setFormError(message)
      toast.error(message)
    }
  }

  const columns: Column<Role>[] = [
    {
      key: 'name',
      header: 'Perfil',
      sortValue: (role) => role.name,
      render: (role) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Shield size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink">{roleLabel(role.name)}</p>
            <p className="mt-0.5 truncate font-mono text-[11px] text-ink-muted">{role.name}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Descrição',
      sortValue: (role) => role.description ?? '',
      render: (role) => <span className="text-sm text-ink-muted">{role.description ?? ROLE_ACCESS[role.name] ?? 'Nenhuma permissão configurada.'}</span>,
    },
    {
      key: 'scope',
      header: 'Escopo atual',
      sortValue: (role) => roleScope(role.name),
      render: (role) => (
        <span className={`rounded-full px-2.5 py-1 text-xs ${role.name === 'admin' ? 'bg-primary-soft text-primary' : role.name === 'coordenador' ? 'bg-secondary-soft text-secondary-700' : 'bg-warning-soft text-warning-700'}`}>
          {roleScope(role.name)}
        </span>
      ),
    },
  ]

  return (
    <PageShell>
      <PageHeader
        eyebrow="Gestão de Acesso"
        title="Perfis de Acesso"
        subtitle="Consulte os níveis que podem ser atribuídos aos membros do painel."
        actions={
          <button onClick={() => setCreateOpen(true)} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-normal text-white transition-colors hover:bg-primary-hover">
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
          {roles.isPending ? (
            <div className="space-y-3 p-4">{[1, 2, 3].map((row) => <SkeletonRow key={row} />)}</div>
          ) : roles.isError ? (
            <div role="alert" className="p-6">
              <p className="text-sm font-medium text-error">Não foi possível carregar os perfis.</p>
              <p className="mt-1 text-xs text-ink-muted">{roles.error.message}</p>
              <button type="button" onClick={() => roles.refetch()} className="mt-4 rounded-full border border-error px-3.5 py-2 text-xs font-medium text-error transition-colors hover:bg-error-soft">
                Tentar novamente
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              title={search ? 'Nenhum perfil encontrado' : 'Nenhum perfil cadastrado'}
              description={search ? 'Ajuste o termo de busca e tente novamente.' : 'Crie um perfil para definir o nível de acesso de um membro.'}
              action={!search ? <button onClick={() => setCreateOpen(true)} className="rounded-full bg-primary px-4 py-2 text-sm text-white transition-colors hover:bg-primary-hover">Novo perfil</button> : undefined}
            />
          ) : (
            <DataTable rows={filtered} columns={columns} sort={sort} onSort={setSort} getRowKey={(role) => String(role.id)} loading={roles.isFetching && !roles.isPending} />
          )}
        </div>

        <Drawer
          open={createOpen}
          onOpenChange={(open) => { if (!open) resetCreateForm(); setCreateOpen(open) }}
          title="Novo perfil de acesso"
          subtitle="Cadastre um identificador que possa ser atribuído a um membro."
          size="md"
          footer={
            <>
              <button type="button" onClick={() => setCreateOpen(false)} className="h-9 shrink-0 rounded-full border border-hairline-input px-4 text-sm text-ink-muted transition-colors hover:border-primary hover:text-ink">
                Cancelar
              </button>
              <button type="button" onClick={handleCreate} disabled={createRole.isPending || !name.trim()} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50">
                {createRole.isPending ? 'Criando...' : 'Criar perfil'}
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="rounded-lg border border-warning/30 bg-warning-soft px-3 py-2.5 text-[11px] leading-relaxed text-ink-muted">
              Hoje, somente <strong>admin</strong> e <strong>coordenador</strong> liberam áreas do painel. Um nome personalizado ficará sem permissões até existir uma matriz RBAC.
            </div>

            <RoleField label="Identificador do perfil" value={name} onChange={setName} placeholder="Ex: coordenador" maxLength={64} required />
            <RoleField label="Descrição visível" value={description} onChange={setDescription} placeholder="Ex: Gestão de membros e rede" maxLength={500} />
            {formError && <p role="alert" className="rounded-lg bg-error-soft px-3 py-2 text-xs leading-relaxed text-error">{formError}</p>}
          </div>
        </Drawer>
      </PageBody>

      <PageFooter>{filtered.length} perfil(is) de acesso exibido(s)</PageFooter>
    </PageShell>
  )
}

function RoleField({ label, value, onChange, placeholder, maxLength, required }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; maxLength?: number; required?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs text-ink-muted">{label} {required && <span className="text-error">*</span>}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} maxLength={maxLength} required={required} className="h-9 w-full rounded-lg border border-hairline-input bg-surface px-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-muted/50 focus:border-primary" />
    </label>
  )
}
