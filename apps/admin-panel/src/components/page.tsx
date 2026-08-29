export function PageShell({ children, width = 'wide' }: { children: React.ReactNode; width?: 'wide' | 'medium' }) {
  return (
    <main className={`flex min-h-0 flex-1 flex-col ${width === 'wide' ? '' : 'mx-auto w-full max-w-3xl'}`}>
      {children}
    </main>
  )
}

export function PageHeader({ eyebrow, title, subtitle, actions }: { eyebrow?: string | undefined; title: string; subtitle?: string | undefined; actions?: React.ReactNode }) {
  return (
    <header className="flex shrink-0 flex-col gap-4 border-b border-hairline px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[10px] font-medium uppercase tracking-widest text-primary">{eyebrow}</p>
        )}
        <h1 className="mt-1 truncate text-xl font-normal tracking-tight text-ink">{title}</h1>
        {subtitle && (
          <p className="mt-0.5 text-sm text-ink-muted">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  )
}

export function PageBody({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
      {children}
    </div>
  )
}

export function PageFooter({ children }: { children: React.ReactNode }) {
  return (
    <footer className="flex shrink-0 items-center justify-between border-t border-hairline px-6 py-3.5 text-xs text-ink-muted">
      {children}
    </footer>
  )
}
