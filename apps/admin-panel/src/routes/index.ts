import {
  createRouter,
  createRoute,
  createRootRoute,
  redirect,
  Outlet,
} from '@tanstack/react-router'
import { lazy } from 'react'
import { authClient } from '../lib/auth-client.js'
import { api } from '../lib/api.js'
import { AppShell } from '../components/app-shell.js'
import { RoutePending } from '../components/route-pending.js'

const LoginPage = lazy(() => import('./login.js').then((module) => ({ default: module.LoginPage })))
const DashboardPage = lazy(() => import('./dashboard.js').then((module) => ({ default: module.DashboardPage })))
const ProfilePage = lazy(() => import('./profile.js').then((module) => ({ default: module.ProfilePage })))
const MembersPage = lazy(() => import('./members.js').then((module) => ({ default: module.MembersPage })))
const NewMemberPage = lazy(() => import('./member-new.js').then((module) => ({ default: module.NewMemberPage })))
const MemberDetailPage = lazy(() => import('./member-detail.js').then((module) => ({ default: module.MemberDetailPage })))
const RolesPage = lazy(() => import('./roles.js').then((module) => ({ default: module.RolesPage })))
const WifiProfilesPage = lazy(() => import('./wifi-profiles.js').then((module) => ({ default: module.WifiProfilesPage })))
const VouchersPage = lazy(() => import('./vouchers.js').then((module) => ({ default: module.VouchersPage })))
const PresencePage = lazy(() => import('./presence.js').then((module) => ({ default: module.PresencePage })))
const PoliticasPage = lazy(() => import('./politicas.js').then((module) => ({ default: module.PoliticasPage })))
const TermosPage = lazy(() => import('./termos.js').then((module) => ({ default: module.TermosPage })))
const NotFoundPage = lazy(() => import('./not-found.js').then((module) => ({ default: module.NotFoundPage })))

// ---------------------------------------------------------------------------
// Root route
// ---------------------------------------------------------------------------
const rootRoute = createRootRoute({
  component: Outlet,
  notFoundComponent: NotFoundPage,
})

// ---------------------------------------------------------------------------
// Guard helpers — checagem de nível de acesso (RBAC)
// ---------------------------------------------------------------------------
async function requireAuth() {
  const result = await authClient.getSession()
  const session = result && 'data' in result ? result.data : result
  if (!session) {
    throw redirect({ to: '/login' })
  }
  return session
}

async function fetchUserRoles(): Promise<string[]> {
  try {
    const res = await api<{ data: { roles: string[] } }>('/me')
    return res.data?.roles ?? []
  } catch {
    return []
  }
}

type AuthenticatedContext = { roles: string[] }

async function loadAuthenticatedContext(): Promise<AuthenticatedContext> {
  await requireAuth()
  return { roles: await fetchUserRoles() }
}

function requireCoordinatorGuard({ context }: { context: AuthenticatedContext }) {
  if (!context.roles.includes('admin') && !context.roles.includes('coordenador')) {
    throw redirect({ to: '/dashboard' })
  }
}

function requireAdminGuard({ context }: { context: AuthenticatedContext }) {
  if (!context.roles.includes('admin')) {
    throw redirect({ to: '/dashboard' })
  }
}

const authenticatedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'authenticated',
  component: AppShell,
  beforeLoad: loadAuthenticatedContext,
})

// ---------------------------------------------------------------------------
// /login — pública
// ---------------------------------------------------------------------------
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
  beforeLoad: async () => {
    const result = await authClient.getSession()
    const session = result && 'data' in result ? result.data : result
    if (session) throw redirect({ to: '/dashboard' })
  },
})

// ---------------------------------------------------------------------------
// /politicas e /termos — públicas
// ---------------------------------------------------------------------------
const politicasRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/politicas',
  component: PoliticasPage,
})

const termosRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/termos',
  component: TermosPage,
})

// ---------------------------------------------------------------------------
// Rotas com Proteção de Nível de Acesso (RBAC)
// ---------------------------------------------------------------------------
const dashboardRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/dashboard',
  component: DashboardPage,
})

const profileRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/profile',
  component: ProfilePage,
})

const membersRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/members',
  component: MembersPage,
  beforeLoad: requireCoordinatorGuard,
})

const newMemberRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/members/new',
  component: NewMemberPage,
  beforeLoad: requireCoordinatorGuard,
})

const memberDetailRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/members/$memberId',
  component: MemberDetailPage,
  beforeLoad: requireCoordinatorGuard,
})

const rolesRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/roles',
  component: RolesPage,
  beforeLoad: requireAdminGuard,
})

const wifiProfilesRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/wifi-profiles',
  component: WifiProfilesPage,
  beforeLoad: requireCoordinatorGuard,
})

const vouchersRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/vouchers',
  component: VouchersPage,
  beforeLoad: requireCoordinatorGuard,
})

const presenceRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/presence',
  component: PresencePage,
  beforeLoad: requireCoordinatorGuard,
})

// ---------------------------------------------------------------------------
// / → redireciona para /dashboard
// ---------------------------------------------------------------------------
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => { throw redirect({ to: '/dashboard' }) },
})

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------
const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  politicasRoute,
  termosRoute,
  authenticatedRoute.addChildren([
    dashboardRoute,
    profileRoute,
    membersRoute,
    newMemberRoute,
    memberDetailRoute,
    rolesRoute,
    wifiProfilesRoute,
    vouchersRoute,
    presenceRoute,
  ]),
])

export const router = createRouter({
  routeTree,
  defaultPendingComponent: RoutePending,
  defaultNotFoundComponent: NotFoundPage,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
