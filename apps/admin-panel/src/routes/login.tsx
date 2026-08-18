import { useState, useEffect, useId } from 'react'
import { useRouter, Link } from '@tanstack/react-router'
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, UserCheck } from 'lucide-react'
import { authClient } from '../lib/auth-client.js'
import { BackgroundAnimation } from '../components/background-animation.js'
import { api } from '../lib/api.js'

const { signIn } = authClient

const ERROR_MESSAGES: Record<string, string> = {
  account_not_linked:
    'Conta Google não vinculada. Faça login com email e senha e vincule o Google no seu perfil.',
  user_not_found:
    'Nenhuma conta encontrada com este email Google. Solicite acesso ao administrador.',
  sign_up_disabled:
    'Cadastro não permitido. Solicite acesso ao administrador.',
  invalid_email_or_password:
    'Email/CPF ou senha incorretos.',
}

function formatCpf(value: string) {
  const d = value.replace(/\D/g, '').slice(0, 11)
  return d
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4')
}

type InvitationData = {
  id: string
  token: string
  name: string
  email: string
  cpf?: string | null
  phone?: string | null
}

export function LoginPage() {
  const router = useRouter()
  const identifierId = useId()
  const passwordId = useId()
  const confirmPasswordId = useId()

  const [identifier, setIdentifier] = useState('')
  const [identifierType, setIdentifierType] = useState<'email' | 'cpf'>('email')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  // Estado de Convite / Completar Cadastro
  const [inviteToken, setInviteToken] = useState<string | null>(null)
  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [verifyingInvite, setVerifyingInvite] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)

  // Checa URL por erro do OAuth ou inviteToken
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('inviteToken')
    const errorCode = params.get('error')

    if (errorCode) {
      setError(ERROR_MESSAGES[errorCode] ?? 'Erro ao autenticar. Tente novamente.')
    }

    if (token) {
      setInviteToken(token)
      setVerifyingInvite(true)
      api<{ data: InvitationData }>(`/invitations/verify/${token}`)
        .then((res) => {
          setInvitation(res.data)
          setError(null)
        })
        .catch(() => {
          setError('Este convite é inválido, expirou ou já foi utilizado.')
          setInvitation(null)
        })
        .finally(() => {
          setVerifyingInvite(false)
        })
    }
  }, [])

  // Detecta email vs CPF em tempo real para máscara
  useEffect(() => {
    if (identifier.includes('@')) {
      setIdentifierType('email')
    } else if (/\d/.test(identifier) && identifier.length <= 14) {
      setIdentifierType('cpf')
    }
  }, [identifier])

  function handleIdentifierChange(value: string) {
    if (identifierType === 'cpf' || (!identifier.includes('@') && /^\d/.test(value))) {
      setIdentifier(formatCpf(value))
    } else {
      setIdentifier(value)
    }
  }

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const isCpf = identifierType === 'cpf'
      const cleaned = identifier.replace(/\D/g, '')
      const payload = isCpf && cleaned.length === 11 ? cleaned : identifier.trim().toLowerCase()

      const result = await signIn.email({ email: payload, password })
      const authError = 'error' in result ? result.error : null
      if (authError) {
        setError(ERROR_MESSAGES[authError.code ?? ''] ?? 'Email/CPF ou senha incorretos.')
        return
      }
      await router.navigate({ to: '/dashboard' })
    } catch {
      setError('Erro ao conectar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  async function handleAcceptInvitation(e: React.FormEvent) {
    e.preventDefault()
    if (!invitation || !inviteToken) return
    setError(null)

    if (!acceptedTerms) {
      setError('Você deve aceitar os Termos de Uso e a Política de Privacidade para continuar.')
      return
    }
    if (password.length < 8) {
      setError('A senha deve ter no mínimo 8 caracteres.')
      return
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    setLoading(true)

    try {
      // 1. Aceitar convite na API (cria conta, roles e Wi-Fi RADIUS)
      await api('/invitations/accept', {
        method: 'POST',
        body: JSON.stringify({ token: inviteToken, password }),
      })

      // 2. Realizar o login com as credenciais criadas
      const loginResult = await signIn.email({ email: invitation.email, password })
      if ('error' in loginResult && loginResult.error) {
        setError('Cadastro concluído, mas erro ao autenticar. Tente fazer login manualmente.')
        setInvitation(null)
        setInviteToken(null)
        return
      }

      await router.navigate({ to: '/dashboard' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao concluir cadastro.')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true)
    await signIn.social({
      provider: 'google',
      callbackURL: `${window.location.origin}/dashboard`,
      errorCallbackURL: `${window.location.origin}/login`,
    })
    setGoogleLoading(false)
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#fcfcfd] p-4">
      <BackgroundAnimation />

      <div
        data-login-card
        className="relative z-10 w-full max-w-[420px] animate-[fadeUp_0.6s_cubic-bezier(0.16,1,0.3,1)] rounded-3xl border border-hairline bg-surface/80 p-8 shadow-[0_24px_60px_-20px_rgba(15,23,42,0.18)] backdrop-blur-xl"
      >
        {/* Header */}
        <header className="mb-6 text-center">
          <img
            src="/branding/fabitz_logo.svg"
            alt="FabITZ Workspace"
            className="mx-auto mb-3.5 h-16 w-auto drop-shadow-xs"
          />
          <h1 className="text-2xl font-light tracking-tight text-ink">
            {invitation ? 'Concluir Cadastro' : 'FabITZ Workspace'}
          </h1>
          <p className="mt-1 text-xs text-ink-muted">
            {invitation
              ? 'Defina sua senha de acesso ao painel e Wi-Fi'
              : 'Fábrica de Inovação · Painel de Controle'}
          </p>
        </header>

        {/* Verificando convite */}
        {verifyingInvite && (
          <div className="flex flex-col items-center justify-center py-6 gap-2 text-ink-muted text-xs">
            <Loader2 size={24} className="animate-spin text-primary" />
            <span>Validando seu convite...</span>
          </div>
        )}

        {/* Erro inline */}
        {error && !verifyingInvite && (
          <div
            role="alert"
            className="mb-4 flex items-start gap-2.5 rounded-xl border border-error/15 bg-error-soft px-3.5 py-3 animate-[shake_0.35s_ease-in-out]"
          >
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-error" />
            <p className="text-xs leading-relaxed text-error">{error}</p>
          </div>
        )}

        {/* MODO COMPLETAR CADASTRO (quando convidado via link) */}
        {invitation && !verifyingInvite ? (
          <form onSubmit={handleAcceptInvitation} className="space-y-4" noValidate>
            <div className="rounded-2xl border border-hairline bg-surface-soft p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-ink">
                <UserCheck size={16} className="text-primary" />
                <span>Dados do Membro</span>
              </div>
              <div className="text-xs text-ink-muted space-y-1">
                <p>
                  <strong className="font-medium text-ink">Nome:</strong> {invitation.name}
                </p>
                <p>
                  <strong className="font-medium text-ink">Email:</strong> {invitation.email}
                </p>
              </div>
            </div>

            <div>
              <label htmlFor={passwordId} className="mb-1.5 block text-xs font-medium tracking-wide text-ink-muted">
                Crie sua Senha de Acesso <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id={passwordId}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  required
                  className="h-11 w-full rounded-xl border border-hairline-input bg-white/70 px-3.5 pr-10 text-sm font-normal text-ink transition-all duration-200 placeholder:text-ink-muted/40 focus:border-primary focus:bg-white focus:shadow-[0_0_0_4px_rgba(0,102,161,0.10)] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-ink-muted hover:text-ink"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor={confirmPasswordId} className="mb-1.5 block text-xs font-medium tracking-wide text-ink-muted">
                Confirme sua Senha <span className="text-red-500">*</span>
              </label>
              <input
                id={confirmPasswordId}
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
                required
                className="h-11 w-full rounded-xl border border-hairline-input bg-white/70 px-3.5 text-sm font-normal text-ink transition-all duration-200 placeholder:text-ink-muted/40 focus:border-primary focus:bg-white focus:shadow-[0_0_0_4px_rgba(0,102,161,0.10)] focus:outline-none"
              />
            </div>

            {/* Checkbox de Aceite de Termos (Obrigatório) */}
            <div className="flex items-start gap-2.5 rounded-xl border border-hairline bg-surface-soft p-3.5 mt-2">
              <input
                type="checkbox"
                id="terms-checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-hairline-input text-primary focus:ring-primary"
              />
              <label htmlFor="terms-checkbox" className="text-xs text-ink-muted leading-relaxed">
                Li e concordo com os{' '}
                <Link to="/termos" target="_blank" className="text-primary hover:underline font-medium">
                  Termos de Uso
                </Link>{' '}
                e a{' '}
                <Link to="/politicas" target="_blank" className="text-primary hover:underline font-medium">
                  Política de Privacidade
                </Link>
                .
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !acceptedTerms}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-primary-hover hover:shadow-md disabled:opacity-60 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Concluindo cadastro...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Concluir Cadastro e Entrar</span>
                </>
              )}
            </button>
          </form>
        ) : !verifyingInvite ? (
          /* MODO LOGIN TRADICIONAL */
          <>
            <form onSubmit={handleCredentials} className="space-y-5" noValidate>
              <div>
                <label htmlFor={identifierId} className="mb-1.5 block text-xs font-medium tracking-wide text-ink-muted">
                  {identifierType === 'cpf' ? 'CPF' : 'Email ou CPF'}
                </label>
                <input
                  id={identifierId}
                  type="text"
                  inputMode={identifierType === 'cpf' ? 'numeric' : 'email'}
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => handleIdentifierChange(e.target.value)}
                  placeholder="admin@fabrica.com ou 000.000.000-00"
                  required
                  className="h-11 w-full rounded-xl border border-hairline-input bg-white/70 px-3.5 text-sm font-normal text-ink transition-all duration-200 placeholder:text-ink-muted/40 focus:border-primary focus:bg-white focus:shadow-[0_0_0_4px_rgba(0,102,161,0.10)] focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor={passwordId} className="mb-1.5 block text-xs font-medium tracking-wide text-ink-muted">
                  Senha
                </label>
                <div className="relative">
                  <input
                    id={passwordId}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="h-11 w-full rounded-xl border border-hairline-input bg-white/70 px-3.5 pr-10 text-sm font-normal text-ink transition-all duration-200 placeholder:text-ink-muted/40 focus:border-primary focus:bg-white focus:shadow-[0_0_0_4px_rgba(0,102,161,0.10)] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-ink-muted transition-colors hover:bg-surface-soft hover:text-ink"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-primary-hover hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Entrando…</span>
                  </>
                ) : (
                  'Entrar'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-hairline" />
              <span className="text-[11px] uppercase tracking-wider text-ink-muted">ou</span>
              <div className="h-px flex-1 bg-hairline" />
            </div>

            {/* Google */}
            <button
              type="button"
              onClick={handleGoogle}
              disabled={googleLoading}
              className="flex h-11 w-full items-center justify-center gap-2.5 rounded-full border border-hairline-input bg-surface text-sm font-normal text-ink transition-all duration-200 hover:bg-surface-soft hover:shadow-sm disabled:opacity-60"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span>{googleLoading ? 'Redirecionando…' : 'Entrar com Google'}</span>
            </button>
          </>
        ) : null}

        {/* Links de Políticas e Termos (Sempre visíveis) */}
        <footer className="mt-8 pt-4 border-t border-hairline text-center text-[11px] text-ink-muted/60">
          <p className="space-x-2">
            <Link to="/termos" className="hover:text-ink transition-colors">
              Termos de Uso
            </Link>
            <span>·</span>
            <Link to="/politicas" className="hover:text-ink transition-colors">
              Política de Privacidade
            </Link>
          </p>
        </footer>
      </div>
    </div>
  )
}
