import { useState } from 'react'
import { Link, Outlet, useLocation, useRouter, useRouterState } from '@tanstack/react-router'
import { LayoutDashboard, LogOut, Menu, Settings, ShieldCheck, Users, Wifi, X } from 'lucide-react'
import * as Tooltip from '@radix-ui/react-tooltip'
import { authClient } from '../lib/auth-client.js'

const navigation = [
  { to: '/dashboard', label: 'Visão geral', icon: LayoutDashboard },
  { to: '/members', label: 'Membros', icon: Users },
  { to: '/roles', label: 'Perfis de acesso', icon: ShieldCheck },
  { to: '/presence', label: 'Presença Wi-Fi', icon: Wifi },
] as const

export function AppShell() {
  const router = useRouter()
  const location = useLocation()
  const isNavigating = useRouterState({ select: (state) => state.isLoading })
  const { data: session } = authClient.useSession()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  async function logout() {
    await authClient.signOut()
    await router.navigate({ to: '/login' })
  }

  const sidebar = (
    <aside className={`flex h-full flex-col border-r border-hairline bg-surface transition-[width] duration-200 ease-out ${collapsed ? 'w-16' : 'w-60'}`}>
      <div className="flex h-16 items-center justify-between border-b border-hairline px-4">
        {!collapsed && <div><p className="text-sm font-normal tracking-tight text-ink">FAB Workspace</p><p className="text-[10px] uppercase tracking-widest text-ink-muted">Admin</p></div>}
        <button onClick={() => setCollapsed((value) => !value)} className="hidden rounded-lg p-2 text-ink-muted hover:bg-surface-soft hover:text-primary lg:block" aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}><Menu size={18} /></button>
        <button onClick={() => setMobileOpen(false)} className="rounded-lg p-2 text-ink-muted lg:hidden" aria-label="Fechar menu"><X size={18} /></button>
      </div>

      <Tooltip.Provider delayDuration={250}>
        <nav className="flex-1 space-y-1 p-2">
          {!collapsed && <p className="px-3 pb-2 pt-3 text-[10px] font-normal uppercase tracking-widest text-ink-muted">Plataforma</p>}
          {navigation.map((item) => {
            const active = location.pathname === item.to || (item.to === '/members' && location.pathname.startsWith('/members/'))
            const content = <Link to={item.to} onClick={() => setMobileOpen(false)} className={`flex h-10 items-center gap-3 rounded-lg px-3 text-sm transition-colors duration-150 ${active ? 'bg-primary-soft text-primary' : 'text-ink-muted hover:bg-surface-soft hover:text-ink'} ${collapsed ? 'justify-center' : ''}`}><item.icon size={18} strokeWidth={1.8} />{!collapsed && <span>{item.label}</span>}</Link>
            return collapsed ? <Tooltip.Root key={item.to}><Tooltip.Trigger asChild>{content}</Tooltip.Trigger><Tooltip.Portal><Tooltip.Content side="right" sideOffset={8} className="z-50 rounded-md bg-ink px-2.5 py-1.5 text-xs text-white shadow-lg">{item.label}<Tooltip.Arrow className="fill-ink" /></Tooltip.Content></Tooltip.Portal></Tooltip.Root> : <div key={item.to}>{content}</div>
          })}
        </nav>
      </Tooltip.Provider>

      <div className="border-t border-hairline p-2">
        <div className={`flex items-center gap-3 rounded-xl p-2 ${collapsed ? 'justify-center' : ''}`}>
          {session?.user.image ? <img src={session.user.image} alt="" className="h-9 w-9 rounded-full object-cover" /> : <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm text-primary">{session?.user.name?.[0] ?? '?'}</div>}
          {!collapsed && <Link to="/profile" className="min-w-0 flex-1 rounded-md"><p className="truncate text-xs text-ink">{session?.user.name}</p><p className="truncate text-[10px] text-ink-muted">{session?.user.email}</p><span className="mt-1 inline-flex rounded-full bg-primary-soft px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-primary">Administrador</span></Link>}
          {!collapsed && <button onClick={logout} className="rounded-lg p-2 text-ink-muted hover:bg-error-soft hover:text-error" aria-label="Sair"><LogOut size={16} /></button>}
        </div>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-surface-soft">
      <div className={`fixed inset-x-0 top-0 z-[60] h-0.5 overflow-hidden transition-opacity ${isNavigating ? 'opacity-100' : 'opacity-0'}`}><div className="h-full w-1/3 animate-[navigation_1s_ease-in-out_infinite] bg-gradient-to-r from-primary via-accent to-secondary" /></div>
      <div className="hidden lg:block">{sidebar}</div>
      {mobileOpen && <div className="fixed inset-0 z-40 lg:hidden"><button className="absolute inset-0 bg-ink/35" onClick={() => setMobileOpen(false)} aria-label="Fechar menu" /><div className="relative h-full w-60">{sidebar}</div></div>}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-hairline bg-surface px-4 lg:hidden"><button onClick={() => setMobileOpen(true)} className="rounded-lg p-2 text-ink-muted"><Menu size={20} /></button><p className="text-sm text-ink">FAB Workspace</p><Settings size={18} className="text-ink-muted" /></header>
        <div className="min-h-0 flex-1 overflow-y-auto"><Outlet /></div>
      </div>
    </div>
  )
}
