import { SkeletonRow } from './feedback.js'

export function RoutePending() {
  return (
    <main className="flex min-h-dvh items-start justify-center bg-surface-soft p-6 pt-10" role="status" aria-label="Carregando página">
      <div className="w-full max-w-5xl space-y-6">
        <div className="space-y-2 border-b border-hairline pb-5">
          <div className="h-2.5 w-28 rounded-full bg-gradient-to-r from-surface via-hairline to-surface bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]" />
          <div className="h-7 w-48 rounded-lg bg-gradient-to-r from-surface via-hairline to-surface bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]" />
          <div className="h-4 w-72 max-w-full rounded-lg bg-gradient-to-r from-surface via-hairline to-surface bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]" />
        </div>
        <div className="space-y-3 rounded-xl border border-hairline bg-surface p-4">
          {[1, 2, 3, 4].map((row) => <SkeletonRow key={row} />)}
        </div>
      </div>
    </main>
  )
}
