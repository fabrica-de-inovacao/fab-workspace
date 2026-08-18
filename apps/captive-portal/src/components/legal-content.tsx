import type { ReactNode } from 'react'
import { ArrowLeft, Mail } from 'lucide-react'

interface LegalContentProps {
  title: string
  updatedAt: string
  children: ReactNode
}

export function LegalContent({ title, updatedAt, children }: LegalContentProps) {
  return (
    <div className="relative min-h-dvh flex flex-col bg-[#fcfcfd]">

      {/* Top Bar / Header */}
      <header className="sticky top-0 z-30 border-b border-hairline bg-surface/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-4xl items-center gap-4 px-4">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-soft hover:text-ink"
          >
            <ArrowLeft size={16} />
            Voltar
          </button>

          <div className="h-5 w-px bg-hairline" />

          <img
            src="/branding/fabitz_logo.svg"
            alt="FabITZ Workspace"
            className="h-7 w-auto"
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-12">
        <div className="mx-auto w-full max-w-3xl">

          {/* Page Title Block */}
          <div className="mb-10 space-y-2 border-b border-hairline pb-8">
            <p className="text-xs font-medium uppercase tracking-widest text-primary">
              FabITZ Workspace
            </p>
            <h1 className="text-4xl font-light tracking-tight text-ink">{title}</h1>
            <p className="text-sm text-ink-muted">Última atualização: {updatedAt}</p>
          </div>

          {/* Body */}
          <div className="legal-body space-y-8 text-[0.9375rem] leading-7 text-ink/80">
            {children}
          </div>

          {/* Contact block */}
          <div className="mt-12 rounded-2xl border border-primary/20 bg-primary/5 px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Mail size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-ink">Dúvidas ou solicitações?</p>
              <p className="mt-0.5 text-sm text-ink-muted">
                Entre em contato com o suporte pelo e-mail{' '}
                <a
                  href="mailto:suporte@fabitz.com.br"
                  className="font-medium text-primary hover:underline"
                >
                  suporte@fabitz.com.br
                </a>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-hairline bg-surface py-6">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-2 px-4 text-center">
          <img
            src="/branding/fabitz_logo.svg"
            alt="FabITZ Workspace"
            className="h-6 w-auto opacity-40"
          />
          <p className="text-[11px] text-ink-muted/50">
            © {new Date().getFullYear()} Fábrica de Inovação · FabITZ Workspace
          </p>
          <div className="flex items-center gap-3 text-[11px] text-ink-muted/50">
            <a href="/termos" className="hover:text-ink-muted transition-colors">
              Termos de Uso
            </a>
            <span>·</span>
            <a href="/politicas" className="hover:text-ink-muted transition-colors">
              Política de Privacidade
            </a>
            <span>·</span>
            <a href="mailto:suporte@fabitz.com.br" className="hover:text-ink-muted transition-colors">
              suporte@fabitz.com.br
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
