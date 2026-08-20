import { CheckCircle2, ExternalLink, Globe, HardDrive, LogOut, ShieldCheck, Smartphone, User, Wifi } from 'lucide-react'
import { parseMikroTikParams } from '../mikrotik.js'
import { BackgroundAnimation } from '../components/background-animation.js'

export function AfterLoginPage() {
  const params = parseMikroTikParams(window.location.search)

  const username = params.username.trim()
  const isVoucher = !username.includes('@') && username.length > 0
  const isEmail = username.includes('@')

  const formattedUser = isVoucher
    ? formatVoucherDisplay(username)
    : username || 'Membro / Visitante'

  const targetUrl = params.linkOrig || 'https://google.com'
  const logoutUrl = params.linkLogout || '/logout'

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#fcfcfd] p-4">
      <BackgroundAnimation />

      <div
        data-after-login-card
        className="relative z-10 w-full max-w-[440px] animate-[fadeUp_0.6s_cubic-bezier(0.16,1,0.3,1)] rounded-3xl border border-hairline bg-surface/80 p-8 text-center shadow-[0_24px_60px_-20px_rgba(15,23,42,0.18)] backdrop-blur-xl"
      >
        <header className="mb-6">
          <img
            src="/branding/fabitz_logo.svg"
            alt="FabITZ Workspace"
            className="mx-auto mb-3.5 h-16 w-auto drop-shadow-xs"
          />
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-medium text-emerald-700">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-600" />
            <span>Conectado à Rede Wi-Fi</span>
          </div>
        </header>

        {/* Informação de Boas-Vindas */}
        <div className="space-y-1 mb-6">
          <h1 className="text-2xl font-light tracking-tight text-ink">
            {isEmail ? 'Bem-vindo(a)!' : isVoucher ? 'Voucher Ativado!' : 'Acesso Liberado!'}
          </h1>
          <p className="text-xs text-ink-muted">
            Fábrica de Inovação · FabITZ Workspace
          </p>
        </div>

        {/* Card do Usuário Logado */}
        <div className="mb-6 rounded-2xl border border-hairline bg-surface-soft p-4 text-left space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              {isEmail ? <User size={20} /> : <ShieldCheck size={20} />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-medium uppercase tracking-wider text-ink-muted">
                {isEmail ? 'Conta Conectada' : isVoucher ? 'Código do Voucher' : 'Usuário Conectado'}
              </p>
              <p className="truncate text-sm font-mono font-medium text-ink">
                {formattedUser}
              </p>
            </div>
          </div>

          <div className="h-px bg-hairline" />

          {/* Dados do Dispositivo / Conexão */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2 text-ink-muted">
              <Smartphone size={14} className="shrink-0 text-primary/70" />
              <div className="min-w-0">
                <p className="text-[9px] uppercase font-medium tracking-wider text-ink-muted/60">IP / MAC</p>
                <p className="truncate font-mono font-medium text-ink text-[11px]">
                  {params.ip || '10.0.0.x'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-ink-muted">
              <Globe size={14} className="shrink-0 text-primary/70" />
              <div className="min-w-0">
                <p className="text-[9px] uppercase font-medium tracking-wider text-ink-muted/60">Status</p>
                <p className="truncate font-medium text-emerald-700 text-[11px]">
                  Ativo e liberado
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="space-y-3">
          <a
            href={targetUrl}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-primary-hover hover:shadow-md"
          >
            <span>Navegar na Internet</span>
            <ExternalLink size={16} />
          </a>

          {params.linkLogout && (
            <form action={logoutUrl} method="post">
              <button
                type="submit"
                className="flex h-10 w-full items-center justify-center gap-1.5 rounded-full border border-error/30 bg-error/5 text-xs font-medium text-error hover:bg-error/10 transition-colors"
              >
                <LogOut size={14} />
                <span>Desconectar da Rede</span>
              </button>
            </form>
          )}
        </div>

        {/* Rodapé / Políticas */}
        <footer className="mt-8 pt-4 border-t border-hairline text-center text-[11px] text-ink-muted/60 leading-relaxed">
          <p className="space-x-2">
            <a href="/termos" target="_blank" className="hover:text-ink transition-colors">
              Termos de Uso
            </a>
            <span>·</span>
            <a href="/politicas" target="_blank" className="hover:text-ink transition-colors">
              Política de Privacidade
            </a>
          </p>
        </footer>
      </div>
    </div>
  )
}

function formatVoucherDisplay(code: string): string {
  const clean = code.replace(/[^A-Z0-9]/gi, '').toUpperCase()
  if (clean.startsWith('FAB') && clean.length >= 11) {
    return `FAB-${clean.slice(3, 7)}-${clean.slice(7, 11)}`
  }
  return code.toUpperCase()
}
