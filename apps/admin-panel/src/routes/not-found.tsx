import { Link } from '@tanstack/react-router'
import { ArrowLeft, Home, FileQuestion } from 'lucide-react'
import { BackgroundAnimation } from '../components/background-animation.js'

export function NotFoundPage() {
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#fcfcfd] p-4">
      <BackgroundAnimation />

      <div
        data-404-card
        className="relative z-10 w-full max-w-[440px] animate-[fadeUp_0.6s_cubic-bezier(0.16,1,0.3,1)] rounded-3xl border border-hairline bg-surface/80 p-8 text-center shadow-[0_24px_60px_-20px_rgba(15,23,42,0.18)] backdrop-blur-xl"
      >
        <header className="mb-6">
          <img
            src="/branding/fabitz_logo.svg"
            alt="FabITZ Workspace"
            className="mx-auto mb-4 h-14 w-auto drop-shadow-xs"
          />
        </header>

        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <FileQuestion size={32} />
        </div>

        <p className="text-xs font-medium uppercase tracking-widest text-primary">Erro 404</p>
        <h1 className="mt-1 text-2xl font-light tracking-tight text-ink">Página Não Encontrada</h1>
        <p className="mt-2 text-xs leading-relaxed text-ink-muted">
          O endereço que você tentou acessar não existe, foi removido ou está temporariamente indisponível.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full border border-hairline-input bg-surface text-xs font-medium text-ink transition-colors hover:bg-surface-soft"
          >
            <ArrowLeft size={14} />
            <span>Voltar</span>
          </button>
          <Link
            to="/dashboard"
            className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-primary text-xs font-medium text-white shadow-sm transition-all hover:bg-primary-hover hover:shadow-md"
          >
            <Home size={14} />
            <span>Ir para o Início</span>
          </Link>
        </div>

        <footer className="mt-8 pt-4 border-t border-hairline text-center text-[11px] text-ink-muted/50">
          <p>
            FabITZ Workspace · Fábrica de Inovação
          </p>
        </footer>
      </div>
    </div>
  )
}
