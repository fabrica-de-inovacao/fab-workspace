import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import {
  Bell,
  Check,
  KeyRound,
  Lock,
  Moon,
  Palette,
  Shield,
  Sun,
  User,
  Wifi,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { authClient } from '../lib/auth-client.js'
import { useResetWifiPassword, useUpdateMember, useWifiPassword } from '../hooks/use-members.js'
import { useLinkedAccounts } from '../hooks/use-linked-accounts.js'

export type SettingsTab = 'profile' | 'security' | 'network' | 'notifications' | 'appearance'

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
  darkMode: boolean
  onDarkModeChange: (enabled: boolean) => void
}

export function SettingsDialog({ open, onOpenChange, initialTab = 'profile', darkMode, onDarkModeChange }: SettingsDialogProps) {
  const [tab, setTab] = useState<SettingsTab>(initialTab)

  useEffect(() => {
    if (open) setTab(initialTab)
  }, [open, initialTab])

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-ink/40 backdrop-blur-xs animate-[fadeUp_0.15s_ease-out]" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-x-2 bottom-2 top-auto z-[80] flex max-h-[92dvh] flex-col overflow-hidden rounded-3xl border border-hairline bg-surface shadow-2xl animate-[slideInUp_0.2s_ease-out] sm:inset-auto sm:left-1/2 sm:top-1/2 sm:h-[min(85vh,640px)] sm:w-[min(92vw,780px)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:animate-[fadeUp_0.2s_ease-out]"
        >
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-hairline px-5 py-4 sm:px-6">
            <div>
              <Dialog.Title className="text-base font-normal tracking-tight text-ink sm:text-lg">Configurações</Dialog.Title>
              <p className="text-xs text-ink-muted sm:hidden">Preferências da sua conta e aplicativo</p>
            </div>
            <Dialog.Close
              className="flex h-9 w-9 items-center justify-center rounded-xl text-ink-muted transition-colors hover:bg-surface-soft hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              aria-label="Fechar configurações"
            >
              <X size={18} />
            </Dialog.Close>
          </div>

          {/* Body */}
          <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
            {/* Sidebar / Tabs */}
            <nav className="flex shrink-0 gap-1 overflow-x-auto border-b border-hairline bg-surface-soft p-2 no-scrollbar sm:w-52 sm:flex-col sm:border-b-0 sm:border-r sm:p-3">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={`flex min-h-10 items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium transition-colors shrink-0 sm:w-full sm:text-[13px] ${
                    tab === t.key
                      ? 'bg-surface text-primary shadow-xs'
                      : 'text-ink-muted hover:bg-surface/60 hover:text-ink'
                  }`}
                >
                  {t.icon}
                  <span>{t.label}</span>
                </button>
              ))}
            </nav>

            {/* Content Tab */}
            <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
              {tab === 'profile' && <ProfileTab />}
              {tab === 'security' && <SecurityTab />}
              {tab === 'network' && <NetworkTab />}
              {tab === 'notifications' && <NotificationsTab />}
              {tab === 'appearance' && <AppearanceTab darkMode={darkMode} onDarkModeChange={onDarkModeChange} />}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function AppearanceTab({ darkMode, onDarkModeChange }: { darkMode: boolean; onDarkModeChange: (enabled: boolean) => void }) {
  return (
    <div className="space-y-5 animate-[fadeUp_0.15s_ease-out]">
      <div>
        <h3 className="text-sm font-medium text-ink">Aparência da Interface</h3>
        <p className="mt-1 text-xs text-ink-muted">Personalize o tema de cores sincronizado no seu navegador.</p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={darkMode}
        onClick={() => onDarkModeChange(!darkMode)}
        className="flex min-h-14 w-full items-center justify-between rounded-2xl border border-hairline bg-surface-soft p-4 text-left transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      >
        <span className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
            {darkMode ? <Moon size={18} /> : <Sun size={18} />}
          </span>
          <span>
            <span className="block text-sm font-medium text-ink">Tema escuro (Dark Mode)</span>
            <span className="mt-0.5 block text-xs text-ink-muted">{darkMode ? 'Ativado atualmente' : 'Desativado (Claro)'}</span>
          </span>
        </span>
        <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${darkMode ? 'bg-primary' : 'bg-hairline-input'}`}>
          <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-xs transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-1'}`} />
        </span>
      </button>
    </div>
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
      toast.success('Nome de perfil atualizado com sucesso!')
      await authClient.getSession()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar nome.')
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
      toast.success('Conta Google desvinculada.')
    }
  }

  const inputBase = 'w-full rounded-xl border bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors h-10'
  const inputIdle = 'border-hairline-input focus:border-primary focus:ring-2 focus:ring-primary/10'

  return (
    <div className="space-y-6 animate-[fadeUp_0.15s_ease-out]">
      {/* User Header */}
      <div className="flex items-center gap-4">
        {session?.user.image ? (
          <img src={session.user.image} alt="" className="h-14 w-14 rounded-full object-cover ring-2 ring-primary/20" />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-medium text-primary">
            {name[0]?.toUpperCase() ?? '?'}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-base font-medium text-ink">{session?.user.name}</p>
          <p className="truncate text-xs text-ink-muted">{session?.user.email}</p>
        </div>
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-muted">
            Nome exibido <span className="text-error">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!editing}
            className={`${inputBase} ${editing ? inputIdle : 'bg-surface-soft text-ink-muted cursor-not-allowed'}`}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-muted">Endereço de e-mail</label>
          <input
            type="email"
            value={session?.user.email ?? ''}
            disabled
            className={`${inputBase} bg-surface-soft text-ink-muted/70 cursor-not-allowed`}
          />
          <p className="mt-1 text-[11px] text-ink-muted/60">O e-mail principal é gerenciado pela administração do workspace.</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2.5">
        {editing ? (
          <>
            <button
              type="button"
              onClick={() => { setEditing(false); setName(session?.user.name ?? '') }}
              className="h-9 rounded-full border border-hairline-input px-4 text-xs font-medium text-ink-muted transition-colors hover:border-primary hover:text-ink"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={updateMember.isPending || !name.trim()}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-xs font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
            >
              <Check size={14} />
              {updateMember.isPending ? 'Salvando...' : 'Salvar'}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="h-9 rounded-full border border-hairline-input px-4 text-xs font-medium text-ink transition-colors hover:border-primary hover:text-primary"
          >
            Editar perfil
          </button>
        )}
      </div>

      {/* Social Accounts */}
      <div className="border-t border-hairline pt-5">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Contas Conectadas</h4>
        <p className="mt-1 text-xs text-ink-muted">Vincule o Google para acionar login único no painel.</p>

        <div className="mt-3 flex items-center justify-between rounded-2xl border border-hairline bg-surface-soft p-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface text-sm font-bold text-[#4285F4] shadow-xs">
              G
            </div>
            <div>
              <p className="text-xs font-medium text-ink">Google Workspace</p>
              <p className="text-[11px] text-ink-muted">
                {accountsLoading ? 'Verificando...' : googleLinked ? 'Conectado' : 'Não conectado'}
              </p>
            </div>
          </div>
          {!accountsLoading && (
            googleLinked ? (
              <button
                type="button"
                onClick={unlinkGoogle}
                className="rounded-full border border-error/30 px-3.5 py-1.5 text-xs text-error transition-colors hover:bg-error-soft"
              >
                Desvincular
              </button>
            ) : (
              <button
                type="button"
                onClick={linkGoogle}
                className="rounded-full bg-primary px-3.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-hover"
              >
                Vincular
              </button>
            )
          )}
        </div>
      </div>
    </div>
  )
}

function SecurityTab() {
  const { data: session } = authClient.useSession()

  return (
    <div className="space-y-5 animate-[fadeUp_0.15s_ease-out]">
      <div>
        <h3 className="text-sm font-medium text-ink">Segurança & Autenticação</h3>
        <p className="mt-1 text-xs text-ink-muted">Status do método de login e proteção da sua conta.</p>
      </div>

      <div className="rounded-2xl border border-hairline bg-surface-soft p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <Lock size={17} />
          </div>
          <div>
            <p className="text-xs font-medium text-ink">Sessão Autenticada</p>
            <p className="text-[11px] text-ink-muted">Conectado como {session?.user.email}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-hairline p-4 text-xs text-ink-muted leading-relaxed">
        Trocas de senha são processadas pela administração do workspace ou pelo link de redefinição no login.
      </div>
    </div>
  )
}

function NetworkTab() {
  const { data: session } = authClient.useSession()
  const userId = session?.user.id ?? ''
  const wifiQuery = useWifiPassword(userId)
  const resetWifi = useResetWifiPassword(userId)
  const [revealed, setRevealed] = useState<string | null>(null)

  async function handleReveal() {
    const res = await wifiQuery.refetch()
    setRevealed(res.data?.data.password ?? null)
  }

  async function handleReset() {
    try {
      const res = await resetWifi.mutateAsync()
      setRevealed(res.data.wifiPassword)
      toast.success('Sua senha Wi-Fi foi redefinida com sucesso!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao redefinir senha Wi-Fi.')
    }
  }

  return (
    <div className="space-y-5 animate-[fadeUp_0.15s_ease-out]">
      <div>
        <h3 className="text-sm font-medium text-ink">Credenciais Wi-Fi Pessoais</h3>
        <p className="mt-1 text-xs text-ink-muted">Sua senha individual para acesso RADIUS no laboratório.</p>
      </div>

      <div className="rounded-2xl border border-hairline bg-surface-soft p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <KeyRound size={18} />
          </div>
          <div>
            <p className="text-xs font-medium text-ink">Senha Wi-Fi Individual</p>
            <p className="text-[11px] text-ink-muted">Utilizada no login WPA2-Enterprise / Captive Portal</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <code className="min-w-40 rounded-xl border border-hairline bg-surface px-3 py-2 text-xs font-mono text-ink">
            {revealed ?? '••••••••••••'}
          </code>
          <button
            type="button"
            onClick={handleReveal}
            className="h-8 rounded-full border border-hairline-input px-3 text-xs font-medium text-ink transition-colors hover:border-primary hover:text-primary"
          >
            {wifiQuery.isFetching ? 'Carregando...' : revealed ? 'Ocultar' : 'Revelar'}
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={resetWifi.isPending}
            className="h-8 rounded-full border border-hairline-input px-3 text-xs font-medium text-ink-muted transition-colors hover:border-error hover:text-error disabled:opacity-50"
          >
            {resetWifi.isPending ? 'Redefinindo...' : 'Redefinir'}
          </button>
        </div>
      </div>
    </div>
  )
}

function NotificationsTab() {
  const [emailAlerts, setEmailAlerts] = useState(true)

  return (
    <div className="space-y-5 animate-[fadeUp_0.15s_ease-out]">
      <div>
        <h3 className="text-sm font-medium text-ink">Preferências de Comunicação</h3>
        <p className="mt-1 text-xs text-ink-muted">Escolha quais alertas deseja receber do workspace.</p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={emailAlerts}
        onClick={() => setEmailAlerts((v) => !v)}
        className="flex min-h-14 w-full items-center justify-between rounded-2xl border border-hairline bg-surface-soft p-4 text-left transition-colors hover:border-primary/40"
      >
        <div>
          <span className="block text-xs font-medium text-ink">Alertas do Workspace por E-mail</span>
          <span className="mt-0.5 block text-[11px] text-ink-muted">Notificações sobre renovações de acesso e comunicados</span>
        </div>
        <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${emailAlerts ? 'bg-primary' : 'bg-hairline-input'}`}>
          <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-xs transition-transform ${emailAlerts ? 'translate-x-6' : 'translate-x-1'}`} />
        </span>
      </button>
    </div>
  )
}
