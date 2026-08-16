import { toast } from 'sonner'
import { Link } from '@tanstack/react-router'
import { useCreateRole, useRoles } from '../hooks/use-members.js'

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
        wifiRateLimit: String(data.get('wifiRateLimit')) || null,
        wifiSessionTimeout: Number(data.get('wifiSessionTimeout')) || null,
      })
      form.reset()
      toast.success('Perfil criado')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao criar perfil')
    }
  }

  return (
    <main className="min-h-full p-4 sm:p-6">
      <section className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_360px]">
        <div className="rounded-2xl border border-hairline bg-surface p-6 shadow-sm">
          <Link to="/members" className="text-sm text-primary">Voltar para membros</Link>
          <h1 className="mt-5 text-2xl font-light tracking-tight text-ink">Perfis de acesso</h1>
          <p className="mt-1 text-sm text-ink-muted">Cada perfil define os limites aplicados no FreeRADIUS.</p>
          <div className="mt-6 space-y-3">
            {roles.isPending ? <div className="h-20 animate-pulse rounded-xl bg-surface-soft" /> : roles.data?.data.length === 0 ? <p className="rounded-xl bg-surface-soft p-5 text-sm text-ink-muted">Nenhum perfil criado.</p> : roles.data?.data.map((role) => (
              <article key={role.id} className="flex items-center justify-between rounded-xl border border-hairline p-4">
                <div><h2 className="text-sm text-ink">{role.name}</h2><p className="mt-1 text-xs text-ink-muted">{role.description ?? 'Sem descrição'}</p></div>
                <div className="text-right"><p className="text-sm text-primary">{role.wifiRateLimit ?? 'Sem limite'}</p><p className="mt-1 text-xs text-ink-muted">{role.wifiSessionTimeout ? `${role.wifiSessionTimeout}s` : 'Sem timeout'}</p></div>
              </article>
            ))}
          </div>
        </div>

        <form onSubmit={submit} className="h-fit rounded-2xl border border-hairline bg-surface p-6 shadow-sm">
          <h2 className="text-lg font-light text-ink">Novo perfil</h2>
          <div className="mt-5 space-y-4">
            <RoleField label="Nome" name="name" required />
            <RoleField label="Descrição" name="description" />
            <RoleField label="Limite Wi-Fi" name="wifiRateLimit" placeholder="20M/20M" />
            <RoleField label="Tempo de sessão (segundos)" name="wifiSessionTimeout" type="number" />
          </div>
          <button disabled={createRole.isPending} className="mt-6 w-full rounded-full bg-primary px-4 py-2.5 text-sm text-white disabled:opacity-60">{createRole.isPending ? 'Criando...' : 'Criar perfil'}</button>
        </form>
      </section>
    </main>
  )
}

function RoleField(props: { label: string; name: string; type?: string; placeholder?: string; required?: boolean }) {
  return <label><span className="mb-1.5 block text-xs text-ink-muted">{props.label}</span><input {...props} className="w-full rounded-lg border border-hairline-input px-3 py-2.5 text-sm outline-none focus:border-primary" /></label>
}
