import { useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { authClient } from '../lib/auth-client.js'
import { useLinkedAccounts } from '../hooks/use-linked-accounts.js'
import { PageBody, PageHeader, PageShell } from '../components/page.js'

export function ProfilePage() {
  const router = useRouter()
  const { data: session } = authClient.useSession()
  const { accounts, loading, error, refresh } = useLinkedAccounts()
  const [actionError, setActionError] = useState<string | null>(null)
  const [unlinking, setUnlinking] = useState(false)
  const googleLinked = accounts?.some((account) => account.providerId === 'google') ?? false

  async function linkGoogle() {
    setActionError(null)
    const result = await authClient.linkSocial({
      provider: 'google',
      callbackURL: `${window.location.origin}/profile`,
      errorCallbackURL: `${window.location.origin}/profile?error=google_link_failed`,
    })

    if ('error' in result && result.error) {
      setActionError('Não foi possível iniciar o vínculo com o Google.')
    }
  }

  async function unlinkGoogle() {
    setActionError(null)
    setUnlinking(true)
    const result = await authClient.unlinkAccount({ providerId: 'google' })

    if ('error' in result && result.error) {
      setActionError('Não foi possível desvincular a conta Google.')
    } else {
      await refresh()
    }
    setUnlinking(false)
  }

  return (
    <PageShell width="medium">
      <PageHeader
        title="Meu perfil"
        subtitle={session?.user.email}
        actions={
          <button
            type="button"
            onClick={() => router.navigate({ to: '/dashboard' })}
            className="rounded-full border border-hairline-input px-4 py-2 text-sm text-ink-muted transition-colors hover:border-primary hover:text-primary"
          >
            Voltar
          </button>
        }
      />
      <PageBody>

        <section className="mt-8 rounded-xl bg-surface-soft p-5">
          <div>
            <h2 className="text-lg font-light text-ink">Acessos vinculados</h2>
            <p className="mt-1 text-sm text-ink-muted">
              Vincule o Google aqui antes de usá-lo na tela de login.
            </p>
          </div>

          <div className="mt-5 flex items-center justify-between gap-4 rounded-xl border border-hairline bg-surface p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-soft">
                <span className="font-normal text-primary">G</span>
              </div>
              <div>
                <p className="text-sm font-normal text-ink">Google</p>
                <p className="text-xs text-ink-muted">
                  {loading ? 'Verificando vínculo...' : googleLinked ? 'Vinculado' : 'Não vinculado'}
                </p>
              </div>
            </div>

            {!loading && (
              googleLinked ? (
                <button
                  type="button"
                  onClick={unlinkGoogle}
                  disabled={unlinking}
                  className="rounded-full border border-error px-4 py-2 text-sm text-error transition-colors hover:bg-error-soft disabled:opacity-60"
                >
                  {unlinking ? 'Desvinculando...' : 'Desvincular'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={linkGoogle}
                  className="rounded-full bg-primary px-4 py-2 text-sm font-normal text-white transition-colors hover:bg-primary-hover"
                >
                  Vincular Google
                </button>
              )
            )}
          </div>

          {(error || actionError) && (
            <p className="mt-3 text-sm text-error">{error ?? actionError}</p>
          )}
        </section>
      </PageBody>
    </PageShell>
  )
}
