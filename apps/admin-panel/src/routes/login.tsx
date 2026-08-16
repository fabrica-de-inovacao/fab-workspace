import { useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { authClient } from '../lib/auth-client.js'

const { signIn } = authClient

export function LoginPage() {
  const router = useRouter()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  // -------------------------------------------------------------------------
  // Login com email ou CPF
  // -------------------------------------------------------------------------
  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Resolve: CPF (só dígitos, 11 chars) → busca email via API
      const cleaned = identifier.replace(/\D/g, '')
      const isCpf = !identifier.includes('@') && cleaned.length === 11

      let emailToUse = identifier

      if (isCpf) {
        // Busca o email pelo CPF antes de tentar o login
        const res = await fetch(`/api/members/email-by-cpf?cpf=${cleaned}`)
        if (!res.ok) {
          setError('CPF não encontrado. Verifique e tente novamente.')
          return
        }
        const data = await res.json() as { email: string }
        emailToUse = data.email
      }

      const { error: authError } = await signIn.email({
        email: emailToUse,
        password,
      })

      if (authError) {
        setError('Email/CPF ou senha incorretos.')
        return
      }

      await router.navigate({ to: '/dashboard' })
    } catch {
      setError('Erro ao conectar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  // -------------------------------------------------------------------------
  // Login com Google
  // -------------------------------------------------------------------------
  async function handleGoogle() {
    setGoogleLoading(true)
    await signIn.social({
      provider: 'google',
      callbackURL: `${window.location.origin}/dashboard`,
    })
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4"
      style={{
        background: 'linear-gradient(135deg, #0066A1 0%, #2EA3D2 40%, #8EC63F 100%)',
      }}
    >
      <div className="w-full max-w-sm rounded-2xl border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-md">
        {/* Logo / Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
            {/* ponytail: SVG inline simples até logo real existir */}
            <svg viewBox="0 0 24 24" className="h-7 w-7 text-white" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
            </svg>
          </div>
          <h1 className="text-xl font-light tracking-tight text-white">
            Fábrica de Inovação
          </h1>
          <p className="mt-1 text-sm font-light text-white/70">
            Painel Administrativo
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleCredentials} className="space-y-4">
          <div>
            <label
              htmlFor="identifier"
              className="mb-1.5 block text-xs font-normal tracking-wide text-white/80"
            >
              Email ou CPF
            </label>
            <input
              id="identifier"
              type="text"
              autoComplete="username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="admin@fabrica.com ou 000.000.000-00"
              required
              className="w-full rounded-lg border border-white/30 bg-white/15 px-3 py-2.5 text-sm font-light text-white placeholder-white/40 outline-none transition-all focus:border-white/60 focus:bg-white/20 focus:ring-2 focus:ring-white/20"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-xs font-normal tracking-wide text-white/80"
            >
              Senha
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full rounded-lg border border-white/30 bg-white/15 px-3 py-2.5 text-sm font-light text-white placeholder-white/40 outline-none transition-all focus:border-white/60 focus:bg-white/20 focus:ring-2 focus:ring-white/20"
            />
          </div>

          {/* Erro inline */}
          {error && (
            <p className="rounded-lg bg-red-500/20 px-3 py-2 text-xs text-red-100">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-white px-4 py-2.5 text-sm font-normal text-primary transition-all hover:bg-white/90 disabled:opacity-60"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        {/* Divider */}
        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/20" />
          <span className="text-xs text-white/50">ou</span>
          <div className="h-px flex-1 bg-white/20" />
        </div>

        {/* Google */}
        <button
          type="button"
          onClick={handleGoogle}
          disabled={googleLoading}
          className="flex w-full items-center justify-center gap-2.5 rounded-full border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-light text-white transition-all hover:bg-white/20 disabled:opacity-60"
        >
          {/* Google icon */}
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {googleLoading ? 'Redirecionando...' : 'Entrar com Google'}
        </button>
      </div>
    </div>
  )
}
