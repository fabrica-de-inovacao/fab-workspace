import { useState, useRef, useEffect, useCallback } from 'react'
import { MoreHorizontal } from 'lucide-react'

export type DropdownAction = {
  label: string
  icon?: React.ReactNode
  onClick: () => void
  destructive?: boolean
  disabled?: boolean
}

export type DropdownMenuProps = {
  actions: DropdownAction[]
}

export function DropdownMenu({ actions }: DropdownMenuProps) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; right: number }>({ top: 0, right: 0 })
  const triggerRef = useRef<HTMLButtonElement>(null)

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    setPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
  }, [])

  useEffect(() => {
    if (!open) return
    updatePosition()
    function handleClick(e: MouseEvent) {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) setOpen(false)
    }
    function handleScroll() { setOpen(false) }
    document.addEventListener('click', handleClick)
    window.addEventListener('scroll', handleScroll, true)
    return () => {
      document.removeEventListener('click', handleClick)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [open, updatePosition])

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-soft hover:text-ink"
        aria-label="Mais ações"
      >
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div
          className="fixed z-[100] w-48 rounded-lg border border-hairline bg-surface py-1 shadow-lg"
          style={{ top: pos.top, right: pos.right }}
        >
          {actions.map((action, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                action.onClick()
                setOpen(false)
              }}
              disabled={action.disabled}
              className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors disabled:opacity-40 ${
                action.destructive
                  ? 'text-error hover:bg-error-soft'
                  : 'text-ink hover:bg-surface-soft'
              }`}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      )}
    </>
  )
}
