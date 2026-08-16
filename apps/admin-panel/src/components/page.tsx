export function PageShell({ children, width = 'wide' }: { children: React.ReactNode; width?: 'wide' | 'medium' }) {
  return <main className="min-h-full p-4 sm:p-6"><section className={`mx-auto rounded-2xl border border-hairline bg-surface shadow-sm ${width === 'wide' ? 'max-w-6xl' : 'max-w-3xl'}`}>{children}</section></main>
}

export function PageHeader({ eyebrow, title, subtitle, actions }: { eyebrow?: string; title: string; subtitle?: string; actions?: React.ReactNode }) {
  return <header className="flex flex-col items-start justify-between gap-4 p-6 pb-5 sm:flex-row sm:items-end"><div>{eyebrow && <p className="text-[10px] font-normal uppercase tracking-widest text-primary">{eyebrow}</p>}<h1 className="mt-1 text-2xl font-light tracking-tight text-ink">{title}</h1>{subtitle && <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>}</div>{actions}</header>
}

export function PageBody({ children }: { children: React.ReactNode }) {
  return <div className="px-6">{children}</div>
}

export function PageFooter({ children }: { children: React.ReactNode }) {
  return <footer className="px-6 py-5 text-xs text-ink-muted">{children}</footer>
}
