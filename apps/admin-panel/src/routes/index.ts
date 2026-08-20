import {
  createRouter,
  createRoute,
  createRootRoute,
  redirect,
  Outlet,
} from '@tanstack/react-router'
import { authClient } from '../lib/auth-client.js'
import { api } from '../lib/api.js'
import { LoginPage } from './login.js'
import { DashboardPage } from './dashboard.js'
import { ProfilePage } from './profile.js'
import { MembersPage } from './members.js'
import { NewMemberPage } from './member-new.js'
import { MemberDetailPage } from './member-detail.js'
import { RolesPage } from './roles.js'
import { WifiProfilesPage } from './wifi-profiles.js'
import { VouchersPage } from './vouchers.js'
import { PresencePage } from './presence.js'
import { PoliticasPage } from './politicas.js'
import { TermosPage } from './termos.js'
import { NotFoundPage } from './not-found.js'
import { AppShell } from '../components/app-shell.js'

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

async function requireCoordinatorGuard() {
  await requireAuth()
  const roles = await fetchUserRoles()
  if (!roles.includes('admin') && !roles.includes('coordenador')) {
    throw redirect({ to: '/dashboard' })
  }
}

async function requireAdminGuard() {
  await requireAuth()
  const roles = await fetchUserRoles()
  if (!roles.includes('admin')) {
    throw redirect({ to: '/dashboard' })
  }
}

const authenticatedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'authenticated',
  component: AppShell,
  beforeLoad: requireAuth,
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
  beforeLoad: requireAuth,
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
  defaultNotFoundComponent: NotFoundPage,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
