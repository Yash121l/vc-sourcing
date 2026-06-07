import { createRootRoute, createRoute, createRouter, Outlet, notFound } from '@tanstack/react-router'
import { AppShell } from '@/components/layout/AppShell'
import { DashboardPage } from '@/pages/DashboardPage'
import { SourcingPipelinePage } from '@/pages/sourcing/SourcingPipelinePage'
import { DiscoverPage } from '@/pages/sourcing/DiscoverPage'
import { SignalsPage } from '@/pages/sourcing/SignalsPage'
import { CompanyDetailPage } from '@/pages/sourcing/CompanyDetailPage'
import { ScreeningQueuePage } from '@/pages/screening/ScreeningQueuePage'
import { ScreeningDetailPage } from '@/pages/screening/ScreeningDetailPage'

// ─── Root layout ──────────────────────────────────────────────────────────────

const rootRoute = createRootRoute({
  component: AppShell,
  notFoundComponent: () => (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <p className="font-display text-6xl font-light text-muted-foreground">404</p>
      <p className="text-sm text-muted-foreground">Page not found</p>
    </div>
  ),
})

// ─── Dashboard ────────────────────────────────────────────────────────────────

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: DashboardPage,
})

// ─── Sourcing ─────────────────────────────────────────────────────────────────

const sourcingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sourcing',
  component: SourcingPipelinePage,
})

const discoverRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sourcing/discover',
  component: DiscoverPage,
})

const signalsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sourcing/signals',
  component: SignalsPage,
})

const companyDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sourcing/companies/$id',
  component: CompanyDetailPage,
})

// ─── Screening ────────────────────────────────────────────────────────────────

const screeningRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/screening',
  component: ScreeningQueuePage,
})

const screeningDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/screening/$id',
  component: ScreeningDetailPage,
})

const screeningMemosRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/screening/memos',
  component: () => (
    <div className="p-6 text-center text-muted-foreground text-sm">
      IC Memos page — to be implemented (see CLAUDE.md)
    </div>
  ),
})

// ─── Agents ───────────────────────────────────────────────────────────────────

const agentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/agents',
  component: () => (
    <div className="p-6 text-center text-muted-foreground text-sm">
      AI Agents page — to be implemented (see CLAUDE.md)
    </div>
  ),
})

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: () => (
    <div className="p-6 text-center text-muted-foreground text-sm">
      Settings page — to be implemented (see CLAUDE.md)
    </div>
  ),
})

// ─── Router ───────────────────────────────────────────────────────────────────

const routeTree = rootRoute.addChildren([
  indexRoute,
  sourcingRoute,
  discoverRoute,
  signalsRoute,
  companyDetailRoute,
  screeningRoute,
  screeningDetailRoute,
  screeningMemosRoute,
  agentsRoute,
  settingsRoute,
])

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
