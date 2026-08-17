import { useState } from 'react'
import { isValidLoginUrl, parseMikroTikParams } from './mikrotik.js'

export function App() {
  const params = parseMikroTikParams(window.location.search)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
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

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden p-4 sm:p-6">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#0066A1_0%,#2EA3D2_42%,#8EC63F_100%)]" />
      <div className="absolute -left-20 top-12 h-72 w-72 rounded-full bg-white/15 blur-3xl" />
      <div className="absolute -bottom-24 right-0 h-80 w-80 rounded-full bg-yellow-300/15 blur-3xl" />

      <section className="relative z-10 w-full max-w-sm rounded-2xl border border-white/20 bg-white/10 p-7 text-white shadow-2xl backdrop-blur-md sm:p-8">
        {params.success ? <Success /> : <>
          <header className="text-center">
            <Logo />
            <p className="mt-5 text-[10px] font-normal uppercase tracking-[0.24em] text-white/65">Fábrica de Inovação</p>
            <h1 className="mt-2 text-2xl font-light tracking-tight">Conecte-se ao Wi-Fi</h1>
            <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-white/70">Use sua senha individual para acessar a rede da Fábrica.</p>
          </header>

          <form action={params.linkLogin || undefined} method="post" onSubmit={submit} className="mt-8 space-y-4">
             <input type="hidden" name="dst" value={params.linkOrig} />
             <input type="hidden" name="popup" value="true" />
             <label className="block"><span className="mb-1.5 block text-xs font-normal text-white/80">Email de acesso</span><input type="email" name="username" value={username} onChange={(event) => { setUsername(event.target.value); setLocalError('') }} autoComplete="username" required placeholder="seu@email.com" className="w-full rounded-lg border border-white/30 bg-white/15 px-3 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-white/60 focus:bg-white/20 focus:ring-2 focus:ring-white/20" /></label>
             <label className="block"><span className="mb-1.5 block text-xs font-normal text-white/80">Senha de acesso</span><input type="password" name="password" value={password} onChange={(event) => { setPassword(event.target.value); setLocalError('') }} autoComplete="current-password" minLength={6} required placeholder="Digite sua senha" className="w-full rounded-lg border border-white/30 bg-white/15 px-3 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-white/60 focus:bg-white/20 focus:ring-2 focus:ring-white/20" /></label>

            {(params.error || localError) && <p role="alert" className="rounded-lg bg-red-500/20 px-3 py-2.5 text-xs leading-relaxed text-red-50">{localError || friendlyError(params.error)}</p>}

            <button type="submit" disabled={submitting || !username || !password} className="w-full rounded-full bg-white px-4 py-3 text-sm font-normal text-primary transition-colors hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60">{submitting ? 'Conectando...' : 'Conectar'}</button>
          </form>

          {(params.mac || params.ip) && <p className="mt-6 text-center font-mono text-[10px] text-white/40">{params.mac || 'dispositivo'} · {params.ip || 'IP automático'}</p>}
        </>}
      </section>
    </main>
  )
}

function Logo() {
  return <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/15"><svg viewBox="0 0 48 48" className="h-9 w-9" aria-label="Fábrica de Inovação"><path d="M8 35V17l16-9 16 9v18" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round"/><path d="M16 35V23h16v12M12 35h24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/><circle cx="24" cy="17" r="3" fill="currentColor"/></svg></div>
}

function Success() {
  return <div className="py-6 text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-3xl">✓</div><p className="mt-6 text-[10px] font-normal uppercase tracking-[0.24em] text-white/65">Acesso liberado</p><h1 className="mt-2 text-2xl font-light">Conectado!</h1><p className="mt-2 text-sm text-white/70">Você já pode navegar pela internet.</p></div>
}

function friendlyError(error: string) {
  const value = error.toLowerCase()
  if (value.includes('invalid') || value.includes('password') || value.includes('login')) return 'Senha inválida. Verifique e tente novamente.'
  if (value.includes('blocked') || value.includes('disabled')) return 'Seu acesso está inativo. Procure a equipe da Fábrica.'
  return 'Não foi possível conectar. Verifique sua senha e tente novamente.'
}
