import {
  createRouter,
  createRoute,
  createRootRoute,
  redirect,
  Outlet,
} from '@tanstack/react-router'
import { authClient } from '../lib/auth-client.js'
import { LoginPage } from './login.js'
import { DashboardPage } from './dashboard.js'
import { ProfilePage } from './profile.js'
import { MembersPage } from './members.js'
import { NewMemberPage } from './member-new.js'
import { MemberDetailPage } from './member-detail.js'
import { RolesPage } from './roles.js'
import { PresencePage } from './presence.js'
import { AppShell } from '../components/app-shell.js'

// ---------------------------------------------------------------------------
// Root route
// ---------------------------------------------------------------------------
const rootRoute = createRootRoute({
  component: Outlet,
})

// ---------------------------------------------------------------------------
// Guard helper — checa sessão antes de entrar em rotas protegidas
// ---------------------------------------------------------------------------
async function requireAuth() {
  const { data: session } = await authClient.getSession()
  if (!session) {
    throw redirect({ to: '/login' })
  }
  return session
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
    // Se já tem sessão, redireciona para dashboard
    const { data: session } = await authClient.getSession()
    if (session) throw redirect({ to: '/dashboard' })
  },
})

// ---------------------------------------------------------------------------
// /dashboard — protegida
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

const membersRoute = createRoute({ getParentRoute: () => authenticatedRoute, path: '/members', component: MembersPage })
const newMemberRoute = createRoute({ getParentRoute: () => authenticatedRoute, path: '/members/new', component: NewMemberPage })
const memberDetailRoute = createRoute({ getParentRoute: () => authenticatedRoute, path: '/members/$memberId', component: MemberDetailPage })
const rolesRoute = createRoute({ getParentRoute: () => authenticatedRoute, path: '/roles', component: RolesPage })
const presenceRoute = createRoute({ getParentRoute: () => authenticatedRoute, path: '/presence', component: PresencePage })

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
  authenticatedRoute.addChildren([dashboardRoute, profileRoute, membersRoute, newMemberRoute, memberDetailRoute, rolesRoute, presenceRoute]),
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
