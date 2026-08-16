import { useRouter } from '@tanstack/react-router'
import { authClient } from '../lib/auth-client.js'

const { signOut, useSession } = authClient

export function DashboardPage() {
  const router = useRouter()
  const { data: session } = useSession()

  async function handleLogout() {
    await signOut()
    await router.navigate({ to: '/login' })
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface-soft">
      {/* Header provisório — Sprint 3 monta o AppShell completo */}
      <div className="flex items-center justify-between border-b border-hairline bg-surface px-6 py-4">
        <div>
          <h1 className="text-lg font-light tracking-tight text-ink">
            FAB Workspace
          </h1>
          <p className="text-xs text-ink-muted">Painel Administrativo</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-light text-ink-muted">
            {session?.user?.email}
          </span>
          <button
            onClick={handleLogout}
            className="rounded-full border border-hairline-input px-3 py-1.5 text-xs font-normal text-ink-muted transition-colors hover:border-primary hover:text-primary"
          >
            Sair
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 items-center justify-center p-8">
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
              Sprint 1 ✓ — Auth funcionando. Shell UI na Sprint 3.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
