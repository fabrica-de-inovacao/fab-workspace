import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'

export type DrawerProps = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
  title: string
  subtitle?: string | undefined
  size?: 'sm' | 'md' | 'lg' | 'xl'
  footer?: React.ReactNode
  children: React.ReactNode
}

const sizeClasses = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-2xl',
}

export function Drawer({ open, onOpenChange, trigger, title, subtitle, size = 'md', footer, children }: DrawerProps) {
  return (
    <Dialog.Root {...(open !== undefined && { open })} {...(onOpenChange !== undefined && { onOpenChange })}>
      {trigger && <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>}
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-xs transition-opacity duration-200" />
        <Dialog.Content
          className={`fixed inset-x-0 bottom-0 z-50 flex max-h-[90dvh] flex-col rounded-t-2xl bg-surface shadow-2xl transition-all duration-300 ease-out sm:inset-y-0 sm:right-0 sm:left-auto sm:h-full sm:max-h-full sm:w-full ${sizeClasses[size]} sm:rounded-t-none sm:border-l sm:border-hairline animate-[slideInUp_0.25s_ease-out] sm:animate-[slideInRight_0.25s_ease-out]`}
        >
          {/* Handle bar visual no mobile */}
          <div className="mx-auto my-2.5 h-1.5 w-12 shrink-0 rounded-full bg-hairline-input sm:hidden" />

          {/* Header */}
          <div className="flex shrink-0 items-start justify-between border-b border-hairline px-5 py-4 sm:px-6">
            <div>
              <Dialog.Title className="text-xl font-light tracking-tight text-ink">{title}</Dialog.Title>
              {subtitle && <Dialog.Description className="mt-1 text-xs text-ink-muted">{subtitle}</Dialog.Description>}
            </div>
            <Dialog.Close className="rounded-lg p-2 text-ink-muted transition-colors hover:bg-surface-soft hover:text-ink" aria-label="Fechar">
              <X size={18} />
            </Dialog.Close>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6">{children}</div>

          {/* Fixed Footer */}
          {footer && (
            <div className="flex shrink-0 items-center justify-end gap-3 border-t border-hairline bg-surface px-5 py-4 sm:px-6">
              {footer}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
