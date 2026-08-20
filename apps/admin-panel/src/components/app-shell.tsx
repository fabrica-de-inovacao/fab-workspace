import { useState, useRef, useEffect } from 'react'
import { Link, Outlet, useLocation, useRouter, useRouterState } from '@tanstack/react-router'
import { ChevronDown, LayoutDashboard, LogOut, Moon, PanelLeftClose, PanelLeftOpen, Settings, Shield, Sliders, Sun, Ticket, Users, Wifi, X } from 'lucide-react'
import * as Tooltip from '@radix-ui/react-tooltip'
import { authClient } from '../lib/auth-client.js'
import { useMe } from '../hooks/use-me.js'
import { SettingsDialog } from './settings-dialog.js'

type RoleRequired = 'admin' | 'coordinator'

interface NavItem {
  to: string
  label: string
  icon: any
  requiredRole?: RoleRequired
}

interface NavGroup {
  title: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    title: 'Principal',
    items: [
      { to: '/dashboard', label: 'Visão geral', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Membros',
    items: [
      { to: '/members', label: 'Membros', icon: Users, requiredRole: 'coordinator' },
    ],
  },
  {
    title: 'Rede',
    items: [
      { to: '/wifi-profiles', label: 'Perfis Wi-Fi', icon: Sliders, requiredRole: 'coordinator' },
      { to: '/vouchers', label: 'Vouchers', icon: Ticket, requiredRole: 'coordinator' },
      { to: '/presence', label: 'Presença Wi-Fi', icon: Wifi },
    ],
  },
  {
    title: 'Sistema',
    items: [
      { to: '/roles', label: 'Perfis de Acesso', icon: Shield, requiredRole: 'admin' },
    ],
  },
]

export function AppShell() {
  const router = useRouter()
  const location = useLocation()
  const isNavigating = useRouterState({ select: (state) => state.isLoading })
  const { data: session } = authClient.useSession()
  const { isAdmin, isCoordinator } = useMe()

  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'Principal': true,
    'Membros': true,
    'Rede': true,
    'Sistema': true,
  })

  function isItemVisible(requiredRole?: RoleRequired) {
    if (requiredRole === 'admin') return isAdmin
    if (requiredRole === 'coordinator') return isCoordinator
    return true
  }

  function toggleGroup(title: string) {
    setExpandedGroups((prev) => ({ ...prev, [title]: !prev[title] }))
  }

  async function logout() {
    await authClient.signOut()
    await router.navigate({ to: '/login' })
  }

  function isActive(to: string) {
    if (to === '/members') return location.pathname === to || location.pathname.startsWith('/members/')
    return location.pathname === to
  }

  // Fecha menu do usuário ao clicar fora
  useEffect(() => {
    if (!userMenuOpen) return
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [userMenuOpen])

  const sidebar = (
    <aside className={`flex h-full flex-col transition-[width] duration-200 ease-out ${collapsed ? 'w-16' : 'w-60'}`}>
      {/* Header */}
      <div className={`flex h-14 shrink-0 items-center ${collapsed ? 'justify-center' : 'px-4'}`}>
        {!collapsed && (
          <div className="flex flex-1 items-center gap-2.5">
            <img src="/branding/fabitz_logo.svg" alt="" className="h-7 w-auto shrink-0" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium tracking-tight text-ink">FabITZ</p>
              <p className="text-[9px] uppercase tracking-widest text-ink-muted/50">Workspace</p>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="hidden shrink-0 rounded-lg p-1.5 text-ink-muted/50 transition-colors hover:bg-white/60 hover:text-ink lg:block"
          aria-label={collapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
        <button onClick={() => setMobileOpen(false)} className="shrink-0 rounded-lg p-1.5 text-ink-muted/50 lg:hidden" aria-label="Fechar">
          <X size={16} />
        </button>
      </div>

      {/* Nav */}
      <Tooltip.Provider delayDuration={300}>
        <nav className="flex-1 space-y-3 overflow-y-auto px-4 py-2">
          {navGroups.map((group) => {
            const visibleItems = group.items.filter((item) => isItemVisible(item.requiredRole))
            if (visibleItems.length === 0) return null

            const isExpanded = expandedGroups[group.title] ?? true
            const hasActiveChild = visibleItems.some((item) => isActive(item.to))

            return (
              <div key={group.title}>
                {!collapsed ? (
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.title)}
                    className={`flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                      hasActiveChild ? 'text-primary/60' : 'text-ink-muted/40 hover:text-ink-muted/70'
                    }`}
                  >
                    <ChevronDown size={11} className={`shrink-0 transition-transform duration-150 ${isExpanded ? '' : '-rotate-90'}`} />
                    <span className="flex-1 text-left">{group.title}</span>
                  </button>
                ) : (
                  <div className="mx-auto my-2 h-px w-5 rounded-full bg-ink-muted/15" />
                )}

                {(isExpanded || collapsed) && (
                  <div className="mt-0.5 space-y-0.5">
                    {visibleItems.map((item) => {
                      const active = isActive(item.to)
                      const link = (
                        <Link
                          to={item.to}
                          onClick={() => setMobileOpen(false)}
                          className={`group flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] transition-all duration-150 ${
                            active
                              ? 'bg-white/80 font-medium text-primary shadow-[0_1px_3px_rgba(0,0,0,0.06)]'
                              : 'text-ink-muted hover:bg-white/50 hover:text-ink'
                          } ${collapsed ? 'justify-center px-0' : ''}`}
                        >
                          <item.icon size={16} strokeWidth={active ? 1.8 : 1.5} className={`shrink-0 transition-colors ${active ? 'text-primary' : 'text-ink-muted/60 group-hover:text-ink-muted'}`} />
                          {!collapsed && <span>{item.label}</span>}
                        </Link>
                      )
                      return collapsed ? (
                        <Tooltip.Root key={item.to}>
                          <Tooltip.Trigger asChild>{link}</Tooltip.Trigger>
                          <Tooltip.Portal>
                            <Tooltip.Content side="right" sideOffset={8} className="z-50 rounded-lg bg-ink px-2.5 py-1.5 text-xs text-white shadow-lg">
                              {item.label}
                              <Tooltip.Arrow className="fill-ink" />
                            </Tooltip.Content>
                          </Tooltip.Portal>
                        </Tooltip.Root>
                      ) : (
                        <div key={item.to}>{link}</div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      </Tooltip.Provider>

      {/* Footer — sessão do usuário */}
      <div className="shrink-0 border-t border-ink-muted/10 px-2 py-2">
        <div ref={userMenuRef} className="relative">
          <button
            type="button"
            onClick={() => !collapsed && setUserMenuOpen((o) => !o)}
            className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-white/50 ${collapsed ? 'justify-center px-0' : ''}`}
          >
            {session?.user.image ? (
              <img src={session.user.image} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover ring-2 ring-white/60" />
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                {session?.user.name?.[0] ?? '?'}
              </div>
            )}
            {!collapsed && (
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-[13px] font-medium text-ink">{session?.user.name}</p>
                <p className="truncate text-[10px] text-ink-muted/50">{session?.user.email}</p>
              </div>
            )}
          </button>

          {/* Menu suspenso do usuário */}
          {userMenuOpen && !collapsed && (
            <div className="absolute bottom-full left-0 mb-1 w-56 rounded-xl border border-hairline bg-surface py-1 shadow-lg">
              <div className="border-b border-hairline px-3 py-2.5">
                <p className="text-xs font-medium text-ink">{session?.user.name}</p>
                <p className="text-[10px] text-ink-muted/60">{session?.user.email}</p>
              </div>

              <div className="py-1">
                <button
                  type="button"
                  onClick={() => { setSettingsOpen(true); setUserMenuOpen(false) }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-ink transition-colors hover:bg-surface-soft"
                >
                  <Settings size={14} className="text-ink-muted/50" />
                  Configurações
                </button>

                <button
                  type="button"
                  onClick={() => { setDarkMode((v) => !v); setUserMenuOpen(false) }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-ink transition-colors hover:bg-surface-soft"
                >
                  {darkMode ? <Sun size={14} className="text-ink-muted/50" /> : <Moon size={14} className="text-ink-muted/50" />}
                  {darkMode ? 'Modo claro' : 'Modo escuro'}
                </button>

              </div>

              <div className="border-t border-hairline py-1">
                <button
                  type="button"
                  onClick={logout}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-error transition-colors hover:bg-error-soft"
                >
                  <LogOut size={14} />
                  Sair da conta
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-[#f1f4f8]">
      {/* Loading bar */}
      <div className={`fixed inset-x-0 top-0 z-[60] h-0.5 overflow-hidden transition-opacity ${isNavigating ? 'opacity-100' : 'opacity-0'}`}>
        <div className="h-full w-1/3 animate-[navigation_1s_ease-in-out_infinite] bg-gradient-to-r from-primary via-accent to-secondary" />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:block">{sidebar}</div>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button className="absolute inset-0 bg-ink/35" onClick={() => setMobileOpen(false)} aria-label="Fechar" />
          <div className="relative h-full w-60">{sidebar}</div>
        </div>
      )}

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center border-b border-hairline bg-surface px-4 lg:hidden">
          <button onClick={() => setMobileOpen(true)} className="rounded-lg p-2 text-ink-muted">
            <PanelLeftOpen size={20} />
          </button>
          <p className="ml-2 text-sm font-medium text-ink">FAB Workspace</p>
        </header>

        <div className="flex-1 overflow-hidden p-3 sm:p-4">
          <div className="flex h-full flex-col overflow-y-auto rounded-2xl border border-hairline bg-surface shadow-sm">
            <Outlet />
          </div>
        </div>
      </div>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  )
}
