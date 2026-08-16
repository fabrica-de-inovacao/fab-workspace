export function App() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-soft">
      <div className="rounded-2xl border border-hairline bg-surface p-8 shadow-sm">
        <h1 className="text-2xl font-light tracking-tight text-ink">
          FAB Workspace
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Admin Panel — Sprint 0 ✓
        </p>
        <div className="mt-4 flex gap-2">
          <span className="rounded-full bg-secondary-soft px-3 py-1 text-xs font-medium text-secondary-700">
            Monorepo OK
          </span>
          <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary">
            Tailwind v4
          </span>
        </div>
      </div>
    </div>
  )
}
