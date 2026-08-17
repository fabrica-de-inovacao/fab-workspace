import { useState } from 'react'
import { Eye, EyeOff, Loader2, Wifi, Ticket } from 'lucide-react'
import { isValidLoginUrl, parseMikroTikParams } from './mikrotik.js'
import { BackgroundAnimation } from './components/background-animation.js'

type Mode = 'credentials' | 'voucher'

export function App() {
  const params = parseMikroTikParams(window.location.search)
  const [mode, setMode] = useState<Mode>('credentials')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [voucher, setVoucher] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [localError, setLocalError] = useState('')

  function submit(event: React.FormEvent<HTMLFormElement>) {
    if (!isValidLoginUrl(params.linkLogin, params.allowedHosts)) {
      event.preventDefault()
      setLocalError('Portal de acesso indisponível. Reconecte à rede e tente novamente.')
      return
    }
    setSubmitting(true)
  }

  const canSubmit = mode === 'credentials'
    ? username.trim().length > 0 && password.length > 0
    : voucher.trim().length > 0

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#fcfcfd] p-4">
      <BackgroundAnimation />

      <div
        data-login-card
        className="relative z-10 w-full max-w-[400px] animate-[fadeUp_0.6s_cubic-bezier(0.16,1,0.3,1)] rounded-3xl border border-hairline bg-surface/80 p-8 shadow-[0_24px_60px_-20px_rgba(15,23,42,0.18)] backdrop-blur-xl"
      >
        {params.success ? (
          <Success />
        ) : (
          <>
            <header className="mb-8 text-center">
              <img
                src="/branding/fabitz_logo.svg"
                alt="FabITZ Workspace"
                className="mx-auto mb-3.5 h-16 w-auto drop-shadow-xs"
              />
              <h1 className="text-2xl font-light tracking-tight text-ink">Conecte-se ao Wi-Fi</h1>
              <p className="mt-1 text-xs text-ink-muted">
                Fábrica de Inovação · Acesso à Rede
              </p>
            </header>

            {/* Tabs Credentials / Voucher */}
            <div className="mb-6 flex rounded-full border border-hairline-input bg-surface-soft p-1">
              <button
                type="button"
                onClick={() => { setMode('credentials'); setLocalError('') }}
                className={`flex-1 rounded-full py-2 text-sm transition-all duration-200 ${
                  mode === 'credentials'
                    ? 'bg-primary text-white shadow-sm font-medium'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                Email e senha
              </button>
              <button
                type="button"
                onClick={() => { setMode('voucher'); setLocalError('') }}
                className={`flex-1 rounded-full py-2 text-sm transition-all duration-200 ${
                  mode === 'voucher'
                    ? 'bg-primary text-white shadow-sm font-medium'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                Voucher de visitante
              </button>
            </div>

            {(params.error || localError) && (
              <div
                role="alert"
                className="mb-5 flex items-start gap-2.5 rounded-xl border border-error/15 bg-error-soft px-3.5 py-3 animate-[shake_0.35s_ease-in-out]"
              >
                <p className="text-xs leading-relaxed text-error">
                  {localError || friendlyError(params.error)}
                </p>
              </div>
            )}

            {mode === 'credentials' ? (
              <form action={params.linkLogin || undefined} method="post" onSubmit={submit} className="space-y-5">
                <input type="hidden" name="dst" value={params.linkOrig} />
                <input type="hidden" name="popup" value="true" />

                <div>
                  <label htmlFor="cp-email" className="mb-1.5 block text-xs font-medium tracking-wide text-ink-muted">
                    Email de acesso
                  </label>
                  <input
                    id="cp-email"
                    type="email"
                    name="username"
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); setLocalError('') }}
                    autoComplete="username"
                    required
                    placeholder="seu@email.com"
                    className="h-11 w-full rounded-xl border border-hairline-input bg-white/70 px-3.5 text-sm font-normal text-ink transition-all duration-200 placeholder:text-ink-muted/40 focus:border-primary focus:bg-white focus:shadow-[0_0_0_4px_rgba(0,102,161,0.10)] focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="cp-password" className="mb-1.5 block text-xs font-medium tracking-wide text-ink-muted">
                    Senha de acesso
                  </label>
                  <div className="relative">
                    <input
                      id="cp-password"
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setLocalError('') }}
                      autoComplete="current-password"
                      minLength={6}
                      required
                      placeholder="••••••••"
                      className="h-11 w-full rounded-xl border border-hairline-input bg-white/70 px-3.5 pr-10 text-sm font-normal text-ink transition-all duration-200 placeholder:text-ink-muted/40 focus:border-primary focus:bg-white focus:shadow-[0_0_0_4px_rgba(0,102,161,0.10)] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      tabIndex={-1}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-ink-muted transition-colors hover:bg-surface-soft hover:text-ink"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting || !canSubmit}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-primary-hover hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <><Loader2 size={16} className="animate-spin" /><span>Conectando…</span></>
                  ) : (
                    <><Wifi size={16} /><span>Conectar</span></>
                  )}
                </button>
              </form>
            ) : (
              <form action={params.linkLogin || undefined} method="post" onSubmit={submit} className="space-y-5">
                <input type="hidden" name="dst" value={params.linkOrig} />
                <input type="hidden" name="popup" value="true" />

                <div>
                  <label htmlFor="cp-voucher" className="mb-1.5 block text-xs font-medium tracking-wide text-ink-muted">
                    Código do voucher
                  </label>
                  <div className="relative">
                    <Ticket size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted/40" />
                    <input
                      id="cp-voucher"
                      type="text"
                      name="username"
                      value={voucher}
                      onChange={(e) => { setVoucher(e.target.value); setLocalError('') }}
                      autoComplete="off"
                      required
                      placeholder="Ex: VISIT-ABCD-1234"
                      className="h-11 w-full rounded-xl border border-hairline-input bg-white/70 pl-10 pr-3.5 text-sm font-normal text-ink uppercase tracking-wider transition-all duration-200 placeholder:text-ink-muted/40 placeholder:normal-case placeholder:tracking-normal focus:border-primary focus:bg-white focus:shadow-[0_0_0_4px_rgba(0,102,161,0.10)] focus:outline-none"
                    />
                  </div>
                  <p className="mt-2 text-[11px] text-ink-muted/50">
                    Solicite o voucher de acesso na recepção da Fábrica.
                  </p>
                </div>

                <input type="hidden" name="password" value={voucher} />

                <button
                  type="submit"
                  disabled={submitting || !canSubmit}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-primary-hover hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <><Loader2 size={16} className="animate-spin" /><span>Conectando…</span></>
                  ) : (
                    <><Wifi size={16} /><span>Conectar com voucher</span></>
                  )}
                </button>
              </form>
            )}

            {(params.mac || params.ip) && (
              <p className="mt-6 text-center font-mono text-[10px] text-ink-muted/40">
                {params.mac || 'dispositivo'} · {params.ip || 'IP automático'}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function Success() {
  return (
    <div className="py-6 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-600">✓</div>
      <p className="mt-6 text-[10px] font-medium uppercase tracking-widest text-primary">Acesso liberado</p>
      <h1 className="mt-2 text-2xl font-light tracking-tight text-ink">Conectado!</h1>
      <p className="mt-2 text-sm text-ink-muted">Você já pode navegar pela internet.</p>
    </div>
  )
}

function friendlyError(error: string) {
  const value = error.toLowerCase()
  if (value.includes('invalid') || value.includes('password') || value.includes('login')) return 'Senha ou voucher inválido. Verifique e tente novamente.'
  if (value.includes('blocked') || value.includes('disabled')) return 'Seu acesso está inativo. Procure a equipe da Fábrica.'
  return 'Não foi possível conectar. Verifique seus dados e tente novamente.'
}
