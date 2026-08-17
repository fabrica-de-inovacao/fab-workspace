import { toast } from 'sonner'
import { useCreateRole, useRoles } from '../hooks/use-members.js'
import { PageBody, PageHeader, PageShell } from '../components/page.js'

export function RolesPage() {
  const roles = useRoles()
  const createRole = useCreateRole()

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    try {
      await createRole.mutateAsync({
        name: String(data.get('name')),
        description: String(data.get('description')) || null,
      })
      form.reset()
      toast.success('Perfil de acesso criado')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao criar perfil de acesso')
    }
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="Gestão de Acesso"
        title="Perfis de Acesso"
        subtitle="Permissões de usuário no painel administrativo."
      />
      <PageBody>
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-3">
            {roles.isPending ? (
              <div className="h-20 animate-pulse rounded-xl bg-surface-soft" />
            ) : roles.data?.data.length === 0 ? (
              <p className="rounded-xl bg-surface-soft p-5 text-sm text-ink-muted">Nenhum perfil de acesso criado.</p>
            ) : (
              roles.data?.data.map((role) => (
                <article key={role.id} className="flex items-center justify-between rounded-xl border border-hairline p-4">
                  <div>
                    <h2 className="text-sm font-normal text-ink">{role.name}</h2>
                    <p className="mt-1 text-xs text-ink-muted">{role.description ?? 'Sem descrição'}</p>
                  </div>
                  <span className="rounded-full bg-primary-soft px-2.5 py-1 text-xs text-primary">
                    {role.name === 'admin' ? 'Acesso Total' : 'Restrito'}
                  </span>
                </article>
              ))
            )}
          </div>

          <form onSubmit={submit} className="h-fit rounded-xl border border-hairline bg-surface-soft p-5">
            <h2 className="text-sm font-normal text-ink">Novo perfil de acesso</h2>
            <div className="mt-4 space-y-3">
              <RoleField label="Nome do perfil" name="name" placeholder="Ex: admin, member" required />
              <RoleField label="Descrição" name="description" placeholder="Ex: Acesso total de administração" />
            </div>
            <button disabled={createRole.isPending} className="mt-5 w-full rounded-full bg-primary px-4 py-2.5 text-sm text-white disabled:opacity-60">
              {createRole.isPending ? 'Criando...' : 'Criar perfil'}
            </button>
          </form>
        </div>
      </PageBody>
    </PageShell>
  )
}

function RoleField(props: { label: string; name: string; type?: string; placeholder?: string; required?: boolean }) {
  return (
    <label>
      <span className="mb-1.5 block text-xs text-ink-muted">{props.label}</span>
      <input {...props} className="w-full rounded-lg border border-hairline-input px-3 py-2.5 text-sm outline-none focus:border-primary" />
    </label>
  )
}
