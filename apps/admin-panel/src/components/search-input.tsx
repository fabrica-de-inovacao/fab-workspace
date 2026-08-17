import { Search, X } from 'lucide-react'

export type SearchInputProps = {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}

export function SearchInput({ value, onChange, placeholder = 'Buscar...', className }: SearchInputProps) {
  return (
    <div className={`relative ${className ?? ''}`}>
      <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted/50" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 w-full rounded-lg border border-hairline-input bg-surface pl-9 pr-8 text-sm text-ink outline-none transition-colors placeholder:text-ink-muted/50 focus:border-primary focus:ring-2 focus:ring-primary/10"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-ink-muted transition-colors hover:text-ink"
          aria-label="Limpar busca"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}
