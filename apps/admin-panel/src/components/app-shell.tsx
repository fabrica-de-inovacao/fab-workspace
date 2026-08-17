import { useState } from 'react'
import { Link, Outlet, useLocation, useRouter, useRouterState } from '@tanstack/react-router'
import { ChevronDown, ChevronRight, LayoutDashboard, LogOut, Menu, Radio, Settings, Sliders, Users, Wifi, X } from 'lucide-react'
import * as Tooltip from '@radix-ui/react-tooltip'
import { authClient } from '../lib/auth-client.js'

const topNavigation = [
  { to: '/dashboard', label: 'Visão geral', icon: LayoutDashboard },
] as const

const navGroups = [
  {
    title: 'Gestão de Membros',
    icon: Users,
    items: [
      { to: '/members', label: 'Membros', icon: Users },
    ],
  },
  {
    title: 'Gestão de Rede',
    icon: Radio,
    items: [
      { to: '/wifi-profiles', label: 'Perfis de rede Wi-Fi', icon: Sliders },
      { to: '/presence', label: 'Presença Wi-Fi', icon: Wifi },
    ],
  },
] as const

export function AppShell() {
  const router = useRouter()
  const location = useLocation()
  const isNavigating = useRouterState({ select: (state) => state.isLoading })
  const { data: session } = authClient.useSession()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'Gestão de Membros': true,
    'Gestão de Rede': true,
  })

  function toggleGroup(title: string) {
    setExpandedGroups((prev) => ({ ...prev, [title]: !prev[title] }))
  }

  async function logout() {
    await authClient.signOut()
    await router.navigate({ to: '/login' })
  }

  const sidebar = (
    <aside className={`flex h-full flex-col border-r border-hairline bg-surface transition-[width] duration-200 ease-out ${collapsed ? 'w-16' : 'w-60'}`}>
      <div className="flex h-16 items-center justify-between border-b border-hairline px-4">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <img src="/branding/fabitz_logo.svg" alt="" className="h-8 w-auto shrink-0" />
            <div>
              <p className="text-sm font-normal tracking-tight text-ink">FabITZ Workspace</p>
              <p className="text-[10px] uppercase tracking-widest text-ink-muted">Fábrica de Inovação</p>
            </div>
          </div>
        )}
        <button onClick={() => setCollapsed((value) => !value)} className="hidden rounded-lg p-2 text-ink-muted hover:bg-surface-soft hover:text-primary lg:block" aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}><Menu size={18} /></button>
        <button onClick={() => setMobileOpen(false)} className="rounded-lg p-2 text-ink-muted lg:hidden" aria-label="Fechar menu"><X size={18} /></button>
      </div>

      <Tooltip.Provider delayDuration={250}>
        <nav className="flex-1 space-y-3 overflow-y-auto p-2">
          <div className="space-y-1">
            {topNavigation.map((item) => {
              const active = location.pathname === item.to
              const content = (
                <Link
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex h-10 items-center gap-3 rounded-lg px-3 text-sm transition-colors duration-150 ${
                    active ? 'bg-primary-soft text-primary' : 'text-ink-muted hover:bg-surface-soft hover:text-ink'
                  } ${collapsed ? 'justify-center' : ''}`}
                >
                  <item.icon size={18} strokeWidth={1.8} />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              )
              return collapsed ? (
                <Tooltip.Root key={item.to}>
                  <Tooltip.Trigger asChild>{content}</Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content side="right" sideOffset={8} className="z-50 rounded-md bg-ink px-2.5 py-1.5 text-xs text-white shadow-lg">
                      {item.label}
                      <Tooltip.Arrow className="fill-ink" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              ) : (
                <div key={item.to}>{content}</div>
              )
            })}
          </div>

          {navGroups.map((group) => {
            const isExpanded = expandedGroups[group.title] ?? true
            const hasActiveChild = group.items.some((item) => location.pathname === item.to || (item.to === '/members' && location.pathname.startsWith('/members/')))

            return (
              <div key={group.title} className="space-y-1">
                {!collapsed ? (
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.title)}
                    className="flex w-full items-center justify-between px-3 py-1.5 text-[10px] font-normal uppercase tracking-widest text-ink-muted hover:text-ink transition-colors"
                  >
                    <span>{group.title}</span>
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                ) : null}

                {(isExpanded || collapsed) && (
                  <div className="space-y-1 pl-0">
                    {group.items.map((item) => {
                      const active = location.pathname === item.to || (item.to === '/members' && location.pathname.startsWith('/members/'))
                      const content = (
                        <Link
                          to={item.to}
                          onClick={() => setMobileOpen(false)}
                          className={`flex h-10 items-center gap-3 rounded-lg px-3 text-sm transition-colors duration-150 ${
                            active ? 'bg-primary-soft text-primary font-normal' : 'text-ink-muted hover:bg-surface-soft hover:text-ink'
                          } ${collapsed ? 'justify-center' : ''}`}
                        >
                          <item.icon size={18} strokeWidth={1.8} />
                          {!collapsed && <span>{item.label}</span>}
                        </Link>
                      )
                      return collapsed ? (
                        <Tooltip.Root key={item.to}>
                          <Tooltip.Trigger asChild>{content}</Tooltip.Trigger>
                          <Tooltip.Portal>
                            <Tooltip.Content side="right" sideOffset={8} className="z-50 rounded-md bg-ink px-2.5 py-1.5 text-xs text-white shadow-lg">
                              {item.label}
                              <Tooltip.Arrow className="fill-ink" />
                            </Tooltip.Content>
                          </Tooltip.Portal>
                        </Tooltip.Root>
                      ) : (
                        <div key={item.to}>{content}</div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      </Tooltip.Provider>

      <div className="border-t border-hairline p-2">
        <div className={`flex items-center gap-3 rounded-xl p-2 ${collapsed ? 'justify-center' : ''}`}>
          {session?.user.image ? (
            <img src={session.user.image} alt="" className="h-9 w-9 rounded-full object-cover" />
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm text-primary">
              {session?.user.name?.[0] ?? '?'}
            </div>
          )}
          {!collapsed && (
            <Link to="/profile" className="min-w-0 flex-1 rounded-md hover:opacity-80 transition-opacity">
              <p className="truncate text-xs font-normal text-ink">{session?.user.name}</p>
              <p className="truncate text-[10px] text-ink-muted">{session?.user.email}</p>
              <span className="mt-1 inline-flex rounded-full bg-primary-soft px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-primary">
                Meu Perfil
              </span>
            </Link>
          )}
          {!collapsed && (
            <button onClick={logout} className="rounded-lg p-2 text-ink-muted hover:bg-error-soft hover:text-error transition-colors" aria-label="Sair">
              <LogOut size={16} />
            </button>
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

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button className="absolute inset-0 bg-ink/35" onClick={() => setMobileOpen(false)} aria-label="Fechar menu" />
          <div className="relative h-full w-60">{sidebar}</div>
        </div>
      )}

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile header */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-hairline bg-surface px-4 lg:hidden">
          <button onClick={() => setMobileOpen(true)} className="rounded-lg p-2 text-ink-muted">
            <Menu size={20} />
          </button>
          <p className="text-sm text-ink">FAB Workspace</p>
          <Settings size={18} className="text-ink-muted" />
        </header>

        {/* Content container — fixo, cantos arredondados, scroll interno */}
        <div className="flex-1 overflow-hidden p-3 sm:p-4">
          <div className="flex h-full flex-col overflow-y-auto rounded-2xl border border-hairline bg-surface shadow-sm">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}
