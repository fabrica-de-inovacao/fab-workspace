import { Link } from '@tanstack/react-router'
import { authClient } from '../lib/auth-client.js'
import { PageBody, PageHeader, PageShell } from '../components/page.js'

const { useSession } = authClient

export function DashboardPage() {
  const { data: session } = useSession()

  return (
    <PageShell>
      <PageHeader
        title={`Olá, ${session?.user?.name?.split(' ')[0] ?? 'usuário'}`}
        subtitle="Bem-vindo ao painel de controle."
      />
      <PageBody>
        <div className="flex items-center justify-center py-12">
          <div className="w-full max-w-md rounded-2xl border border-hairline bg-surface-soft p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-soft text-secondary-700 text-sm font-normal">
                {session?.user?.name?.charAt(0).toUpperCase() ?? '?'}
              </div>
              <div>
                <p className="text-sm font-normal text-ink">
                  {session?.user?.name}
                </p>
                <p className="text-xs text-ink-muted">{session?.user?.email}</p>
              </div>
            </div>
            <div className="mt-6 rounded-lg bg-surface px-4 py-3">
              <p className="text-xs text-ink-muted">
                Gerencie membros, acessos e perfis de rede na navegação lateral.
              </p>
            </div>
            <Link to="/members" className="mt-5 inline-flex rounded-full bg-primary px-4 py-2 text-sm text-white">Gerenciar membros</Link>
          </div>
        </div>
      </PageBody>
    </PageShell>
  )
}
