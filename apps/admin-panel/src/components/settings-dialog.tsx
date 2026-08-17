import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import * as Tooltip from '@radix-ui/react-tooltip'
import { Check, User, Shield, Wifi, Bell, Palette, X } from 'lucide-react'
import { toast } from 'sonner'
import { authClient } from '../lib/auth-client.js'
import { useUpdateMember } from '../hooks/use-members.js'
import { useLinkedAccounts } from '../hooks/use-linked-accounts.js'

type SettingsTab = 'profile' | 'security' | 'network' | 'notifications' | 'appearance'

const tabs: { key: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { key: 'profile', label: 'Perfil', icon: <User size={16} /> },
  { key: 'security', label: 'Segurança', icon: <Shield size={16} /> },
  { key: 'network', label: 'Rede Wi-Fi', icon: <Wifi size={16} /> },
  { key: 'notifications', label: 'Notificações', icon: <Bell size={16} /> },
  { key: 'appearance', label: 'Aparência', icon: <Palette size={16} /> },
]

export type SettingsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialTab?: SettingsTab
}

export function SettingsDialog({ open, onOpenChange, initialTab = 'profile' }: SettingsDialogProps) {
  const [tab, setTab] = useState<SettingsTab>(initialTab)

  useEffect(() => {
    if (open) setTab(initialTab)
  }, [open, initialTab])

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-ink/40 backdrop-blur-xs" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[80] flex h-[min(85vh,600px)] w-[min(90vw,780px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-hairline bg-surface shadow-2xl">
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-hairline px-6 py-4">
            <Dialog.Title className="text-lg font-normal tracking-tight text-ink">Configurações</Dialog.Title>
            <Dialog.Close className="rounded-lg p-2 text-ink-muted transition-colors hover:bg-surface-soft hover:text-ink" aria-label="Fechar">
              <X size={18} />
            </Dialog.Close>
          </div>

          {/* Body */}
          <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
            {/* Sidebar — horizontal no mobile, vertical no desktop */}
            <Tooltip.Provider delayDuration={300}>
              <nav className="flex shrink-0 flex-row items-center gap-1 overflow-x-auto border-b border-hairline bg-surface-soft p-2 sm:flex-col sm:border-b-0 sm:border-r sm:overflow-x-auto sm:items-stretch sm:p-3 sm:w-48">
                {tabs.map((t) => (
                  <Tooltip.Root key={t.key}>
                    <Tooltip.Trigger asChild>
                      <button
                        type="button"
                        onClick={() => setTab(t.key)}
                        className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-colors shrink-0 sm:w-full ${
                          tab === t.key
                            ? 'bg-white font-medium text-primary shadow-sm'
                            : 'text-ink-muted hover:bg-white/60 hover:text-ink'
                        }`}
                      >
                        {t.icon}
                        <span className="hidden sm:inline">{t.label}</span>
                      </button>
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content side="bottom" sideOffset={4} className="z-[90] rounded-md bg-ink px-2 py-1 text-xs text-white shadow-lg sm:hidden">
                        {t.label}
                        <Tooltip.Arrow className="fill-ink" />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                ))}
              </nav>
            </Tooltip.Provider>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {tab === 'profile' && <ProfileTab />}
              {tab === 'security' && <PlaceholderTab title="Segurança" description="Gerencie sua senha e autenticação de dois fatores." />}
              {tab === 'network' && <PlaceholderTab title="Rede Wi-Fi" description="Visualize suas credenciais de acesso à rede." />}
              {tab === 'notifications' && <PlaceholderTab title="Notificações" description="Configure alertas e preferências de notificação." />}
              {tab === 'appearance' && <PlaceholderTab title="Aparência" description="Alterne entre tema claro e escuro." />}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function ProfileTab() {
  const { data: session } = authClient.useSession()
  const updateMember = useUpdateMember(session?.user?.id ?? '')
  const { accounts, loading: accountsLoading, refresh } = useLinkedAccounts()
  const googleLinked = accounts?.some((a) => a.providerId === 'google') ?? false

  const [name, setName] = useState('')
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    if (session?.user) setName(session.user.name ?? '')
  }, [session?.user?.id, session?.user?.name])

  async function handleSave() {
    if (!session?.user?.id || !name.trim()) return
    try {
      await updateMember.mutateAsync({ name: name.trim() })
      setEditing(false)
      toast.success('Perfil atualizado')
      await authClient.getSession()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar')
    }
  }

  async function linkGoogle() {
    await authClient.linkSocial({
      provider: 'google',
      callbackURL: `${window.location.origin}/dashboard`,
      errorCallbackURL: `${window.location.origin}/dashboard?error=google_link_failed`,
    })
  }

  async function unlinkGoogle() {
    const result = await authClient.unlinkAccount({ providerId: 'google' })
    if (!('error' in result && result.error)) {
      await refresh()
      toast.success('Conta Google desvinculada')
    }
  }

  const inputBase = 'w-full rounded-lg border bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors h-9'
  const inputIdle = 'border-hairline-input focus:border-primary'

  return (
    <div className="space-y-6">
      {/* Avatar + info */}
      <div className="flex items-center gap-4">
        {session?.user.image ? (
          <img src={session.user.image} alt="" className="h-14 w-14 rounded-full object-cover" />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-medium text-primary">
            {name[0]?.toUpperCase() ?? '?'}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink">{session?.user.name}</p>
          <p className="text-xs text-ink-muted">{session?.user.email}</p>
        </div>
      </div>

      {/* Campos */}
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs text-ink-muted">
            Nome <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!editing}
            className={`${inputBase} ${editing ? inputIdle : 'bg-surface-soft text-ink-muted/60 cursor-not-allowed'}`}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs text-ink-muted">Email</label>
          <input
            type="email"
            value={session?.user.email ?? ''}
            disabled
            className={`${inputBase} bg-surface-soft text-ink-muted/60 cursor-not-allowed`}
          />
          <p className="mt-1 text-[10px] text-ink-muted/50">Email não pode ser alterado</p>
        </div>
      </div>

      {/* Botões */}
      <div className="flex justify-end gap-3">
        {editing ? (
          <>
            <button type="button" onClick={() => { setEditing(false); setName(session?.user.name ?? '') }} className="h-9 rounded-full border border-hairline-input px-4 text-sm text-ink-muted transition-colors hover:border-primary hover:text-ink">
              Cancelar
            </button>
            <button type="button" onClick={handleSave} disabled={updateMember.isPending || !name.trim()} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50">
              <Check size={14} />
              {updateMember.isPending ? 'Salvando...' : 'Salvar'}
            </button>
          </>
        ) : (
          <button type="button" onClick={() => setEditing(true)} className="h-9 rounded-full border border-primary/30 bg-primary/5 px-4 text-sm font-medium text-primary transition-colors hover:bg-primary/10">
            Editar perfil
          </button>
        )}
      </div>

      {/* Google */}
      <div className="border-t border-hairline pt-5">
        <h4 className="text-sm font-medium text-ink">Conta vinculada</h4>
        <p className="mt-1 text-xs text-ink-muted">Vincule o Google para login com uma única click.</p>

        <div className="mt-3 flex items-center justify-between rounded-xl border border-hairline bg-surface-soft/50 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-sm font-bold text-[#4285F4]">G</div>
            <div>
              <p className="text-sm text-ink">Google</p>
              <p className="text-[10px] text-ink-muted">
                {accountsLoading ? 'Verificando...' : googleLinked ? 'Vinculado' : 'Não vinculado'}
              </p>
            </div>
          </div>
          {!accountsLoading && (
            googleLinked ? (
              <button type="button" onClick={unlinkGoogle} className="rounded-full border border-error px-3 py-1.5 text-xs text-error transition-colors hover:bg-error-soft">
                Desvincular
              </button>
            ) : (
              <button type="button" onClick={linkGoogle} className="rounded-full bg-primary px-3 py-1.5 text-xs text-white transition-colors hover:bg-primary-hover">
                Vincular
              </button>
            )
          )}
        </div>
      </div>
    </div>
  )
}

function PlaceholderTab({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-ink">{title}</h3>
        <p className="mt-1 text-xs text-ink-muted">{description}</p>
      </div>
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-hairline py-16">
        <p className="text-sm text-ink-muted/50">Em breve</p>
      </div>
    </div>
  )
}
