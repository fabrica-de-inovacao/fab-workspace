import { Link } from '@tanstack/react-router'
import { authClient } from '../lib/auth-client.js'

const { useSession } = authClient

export function DashboardPage() {
  const { data: session } = useSession()

  return (
    <div className="min-h-full p-4 sm:p-6">
      <div className="flex min-h-[calc(100vh-3rem)] items-center justify-center">
        <div className="rounded-2xl border border-hairline bg-surface p-8 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-soft text-secondary-700 text-sm font-normal">
              {session?.user?.name?.charAt(0).toUpperCase() ?? '?'}
            </div>
            <div>
              <p className="text-sm font-light text-ink">
                {session?.user?.name}
              </p>
              <p className="text-xs text-ink-muted">{session?.user?.email}</p>
            </div>
          </div>
          <div className="mt-6 rounded-lg bg-surface-soft px-4 py-3">
            <p className="text-xs text-ink-muted">
              Bem-vindo ao painel. Gerencie membros, acessos e perfis na navegação lateral.
            </p>
          </div>
          <Link to="/members" className="mt-5 inline-flex rounded-full bg-primary px-4 py-2 text-sm text-white">Gerenciar membros</Link>
        </div>
      </div>
    </div>
  )
}
