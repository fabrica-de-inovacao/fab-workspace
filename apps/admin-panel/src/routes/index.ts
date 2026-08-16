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
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: DashboardPage,
  beforeLoad: requireAuth,
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
  dashboardRoute,
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
