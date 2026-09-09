import { useId, useRef, useState } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { AlertCircle, ArrowLeft, CheckCircle2, Eye, EyeOff, Loader2, Mail } from 'lucide-react'
import { BackgroundAnimation } from '../components/background-animation.js'
import { authClient } from '../lib/auth-client.js'

export function ForgotPasswordPage() {
  const router = useRouter()
  const emailId = useId()
  const otpId = useId()
  const passwordId = useId()
  const confirmPasswordId = useId()
  const [email, setEmail] = useState('')
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', ''])
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [step, setStep] = useState<'email' | 'otp' | 'password'>('email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const otpRefs = useRef<Array<HTMLInputElement | null>>([])

  const otp = otpDigits.join('')

  async function sendCode() {
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      const result = await authClient.emailOtp.requestPasswordReset({ email: email.trim().toLowerCase() })
      if (result.error) {
        setError('Não foi possível solicitar o código. Tente novamente.')
        return
      }
      setOtpDigits(['', '', '', '', '', ''])
      setStep('otp')
      setSuccess('Se este email estiver cadastrado, você receberá um código em instantes.')
    } catch {
      setError('Não foi possível solicitar o código. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  async function requestCode(event: React.FormEvent) {
    event.preventDefault()
    await sendCode()
  }

  async function verifyOtp(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    if (otp.length !== 6) return

    setLoading(true)
    try {
      const result = await authClient.emailOtp.checkVerificationOtp({
        email: email.trim().toLowerCase(),
        type: 'forget-password',
        otp,
      })
      if (result.error) {
        setError('Código inválido ou expirado. Confira os dígitos e tente novamente.')
        return
      }
      setStep('password')
      setSuccess('Código validado. Agora escolha sua nova senha.')
    } catch {
      setError('Código inválido ou expirado. Confira os dígitos e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  function handleOtpChange(index: number, value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 6)
    const next = [...otpDigits]

    if (digits.length > 1) {
      digits.split('').forEach((digit, offset) => {
        if (index + offset < next.length) next[index + offset] = digit
      })
      setOtpDigits(next)
      otpRefs.current[Math.min(index + digits.length, 5)]?.focus()
      return
    }

    next[index] = digits
    setOtpDigits(next)
    if (digits && index < 5) otpRefs.current[index + 1]?.focus()
  }

  function handleOtpKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
    if (event.key === 'ArrowLeft' && index > 0) otpRefs.current[index - 1]?.focus()
    if (event.key === 'ArrowRight' && index < 5) otpRefs.current[index + 1]?.focus()
  }

  async function resetPassword(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setSuccess(null)

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
      const result = await authClient.emailOtp.resetPassword({
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        password,
      })
      if (result.error) {
        setError('Código inválido, expirado ou já utilizado.')
        return
      }
      await router.navigate({ to: '/login' })
    } catch {
      setError('Código inválido, expirado ou já utilizado.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-surface-soft p-4">
      <BackgroundAnimation />
      <div data-login-card className="relative z-10 w-full max-w-[420px] animate-[fadeUp_0.6s_cubic-bezier(0.16,1,0.3,1)] rounded-3xl border border-hairline bg-surface/80 p-8 shadow-[0_24px_60px_-20px_rgba(15,23,42,0.18)] backdrop-blur-xl">
        <header className="mb-6 text-center">
          <img src="/branding/fabitz_logo.svg" alt="FabITZ Workspace" className="mx-auto mb-3.5 h-16 w-auto drop-shadow-xs" />
          <h1 className="text-2xl font-light tracking-tight text-ink">
            {step === 'email' ? 'Informe seu email' : step === 'otp' ? 'Verifique seu email' : 'Crie uma nova senha'}
          </h1>
          <p className="mt-1 text-xs text-ink-muted">
            {step === 'email' ? 'Vamos enviar um código único para recuperação.' : step === 'otp' ? `Digite o código enviado para ${email}` : 'A senha será atualizada no Workspace e no Wi-Fi.'}
          </p>
        </header>

        {error && (
          <div role="alert" className="mb-4 flex items-start gap-2.5 rounded-xl border border-error/15 bg-error-soft px-3.5 py-3">
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-error" />
            <p className="text-xs leading-relaxed text-error">{error}</p>
          </div>
        )}

        {success && (
          <div role="status" className="mb-4 flex items-start gap-2.5 rounded-xl border border-secondary/15 bg-secondary-soft px-3.5 py-3">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-secondary-700" />
            <p className="text-xs leading-relaxed text-secondary-700">{success}</p>
          </div>
        )}

        {step === 'email' ? (
          <form onSubmit={requestCode} className="space-y-5" noValidate>
            <div>
              <label htmlFor={emailId} className="mb-1.5 block text-xs font-medium tracking-wide text-ink-muted">Email</label>
              <input
                id={emailId}
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="seu@email.com"
                required
                className="h-11 w-full rounded-xl border border-hairline-input bg-surface/70 px-3.5 text-sm text-ink transition-all placeholder:text-ink-muted/40 focus:border-primary focus:bg-surface focus:outline-none focus:ring-4 focus:ring-primary/10"
              />
            </div>
            <button type="submit" disabled={loading} className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? <><Loader2 size={16} className="animate-spin" /> Enviando código...</> : <><Mail size={16} /> Enviar código por email</>}
            </button>
          </form>
        ) : step === 'otp' ? (
          <form onSubmit={verifyOtp} className="space-y-5" noValidate>
            <div>
              <span id={otpId} className="mb-1.5 block text-xs font-medium tracking-wide text-ink-muted">Código de 6 dígitos</span>
              <div className="flex justify-between gap-2" role="group" aria-labelledby={otpId}>
                {otpDigits.map((digit, index) => (
                  <input
                    key={`${otpId}-${index}`}
                    ref={(element) => { otpRefs.current[index] = element }}
                    id={`${otpId}-${index}`}
                    type="text"
                    inputMode="numeric"
                    autoComplete={index === 0 ? 'one-time-code' : 'off'}
                    autoFocus={index === 0}
                    maxLength={1}
                    value={digit}
                    onChange={(event) => handleOtpChange(index, event.target.value)}
                    onKeyDown={(event) => handleOtpKeyDown(index, event)}
                    aria-label={`Dígito ${index + 1}`}
                    required
                    className="h-12 w-11 rounded-xl border border-hairline-input bg-surface/70 text-center font-mono text-lg font-medium text-ink transition-all focus:border-primary focus:bg-surface focus:outline-none focus:ring-4 focus:ring-primary/10 sm:w-12"
                  />
                ))}
              </div>
            </div>
            <button type="submit" disabled={loading || otp.length !== 6} className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? <><Loader2 size={16} className="animate-spin" /> Validando código...</> : 'Validar código'}
            </button>
            <div className="flex items-center justify-between text-xs">
              <button type="button" onClick={() => { void sendCode() }} disabled={loading} className="font-medium text-primary hover:underline disabled:opacity-60">Reenviar código</button>
              <button type="button" onClick={() => { setStep('email'); setError(null); setSuccess(null) }} className="text-ink-muted hover:text-ink">Alterar email</button>
            </div>
          </form>
        ) : (
          <form onSubmit={resetPassword} className="space-y-4" noValidate>
            <div>
              <label htmlFor={passwordId} className="mb-1.5 block text-xs font-medium tracking-wide text-ink-muted">Nova senha</label>
              <div className="relative">
                <input id={passwordId} type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mínimo 8 caracteres" required className="h-11 w-full rounded-xl border border-hairline-input bg-surface/70 px-3.5 pr-10 text-sm text-ink transition-all placeholder:text-ink-muted/40 focus:border-primary focus:bg-surface focus:outline-none focus:ring-4 focus:ring-primary/10" />
                <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-ink-muted hover:text-ink">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor={confirmPasswordId} className="mb-1.5 block text-xs font-medium tracking-wide text-ink-muted">Confirme a nova senha</label>
              <input id={confirmPasswordId} type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Repita a senha" required className="h-11 w-full rounded-xl border border-hairline-input bg-surface/70 px-3.5 text-sm text-ink transition-all placeholder:text-ink-muted/40 focus:border-primary focus:bg-surface focus:outline-none focus:ring-4 focus:ring-primary/10" />
            </div>
            <button type="submit" disabled={loading || otp.length !== 6} className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? <><Loader2 size={16} className="animate-spin" /> Salvando senha...</> : 'Redefinir senha'}
            </button>
            <button type="button" onClick={() => { setStep('otp'); setError(null); setSuccess(null) }} className="w-full text-xs font-medium text-primary hover:underline">
              Voltar para o código
            </button>
          </form>
        )}

        <footer className="mt-8 border-t border-hairline pt-4 text-center text-[11px] text-ink-muted/60">
          <Link to="/login" className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"><ArrowLeft size={13} /> Voltar para o login</Link>
        </footer>
      </div>
    </div>
  )
}
