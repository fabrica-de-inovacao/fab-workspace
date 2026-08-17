import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

export type FormSelectOption = {
  value: string
  label: string
}

export type FormSelectProps = {
  value: string
  onChange: (v: string) => void
  options: FormSelectOption[]
  placeholder?: string
  name?: string
}

export function FormSelect({ value, onChange, options, placeholder, name }: FormSelectProps) {
  const [open, setOpen] = useState(false)
  const selected = options.find((o) => o.value === value)

  return (
    <div className="relative">
      {name && <input type="hidden" name={name} value={value} />}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex h-9 w-full items-center justify-between rounded-lg border border-hairline-input bg-surface px-3 py-2 text-left text-sm transition-colors hover:border-primary/40 focus:border-primary focus:outline-none ${selected ? 'text-ink' : 'text-ink-muted/50'}`}
      >
        <span className="truncate">{selected?.label ?? placeholder}</span>
        <ChevronDown size={14} className={`shrink-0 text-ink-muted transition-transform ${open && 'rotate-180'}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 mt-1 w-full rounded-lg border border-hairline bg-surface py-1 shadow-lg">
            {options.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  onChange(o.value)
                  setOpen(false)
                }}
                className={`flex w-full items-center px-3 py-2 text-left text-sm transition-colors hover:bg-primary/5 ${o.value === value ? 'bg-primary/10 text-primary font-medium' : 'text-ink'}`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
