export function StatusBadge({ active, status }: { active?: boolean; status?: 'pending' | 'error' }) {
  const state = status ?? (active ? 'active' : 'inactive')
  const styles = { active: 'bg-secondary-soft text-secondary-700', inactive: 'bg-hairline text-ink-muted', pending: 'bg-warning-soft text-warning-700', error: 'bg-error-soft text-error' }
  const labels = { active: 'Ativo', inactive: 'Inativo', pending: 'Pendente', error: 'Erro' }
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs ${styles[state]}`}>{labels[state]}</span>
}

export function SkeletonRow() {
  return <div className="h-12 animate-pulse rounded-lg bg-gradient-to-r from-surface-soft via-hairline to-surface-soft bg-[length:200%_100%]" />
}

export function SkeletonCard() {
  return <div className="h-40 animate-pulse rounded-2xl bg-gradient-to-r from-surface via-hairline to-surface bg-[length:200%_100%]" />
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return <div className="p-12 text-center"><div className="mx-auto h-2 w-10 rounded-full bg-primary" /><p className="mt-5 text-base text-ink">{title}</p><p className="mx-auto mt-1 max-w-sm text-sm text-ink-muted">{description}</p>{action && <div className="mt-5">{action}</div>}</div>
}
