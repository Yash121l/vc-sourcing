import { useEffect } from 'react'
import { Outlet } from '@tanstack/react-router'
import { getCurrentUser } from '@/lib/auth'
import { identifyUser } from '@/lib/posthog'
import { Sidebar } from './Sidebar'
import { CommandPalette } from '@/components/CommandPalette'
import { useGlobalShortcuts } from '@/hooks/useGlobalShortcuts'

// Identify by internal id only once a session token exists (no email/name: sensitive app).
function useIdentifyUser() {
  useEffect(() => {
    void getCurrentUser().then(user => {
      if (user) identifyUser(user.id, { organization_id: user.organizationId })
    })
  }, [])
}

function ShortcutsProvider() {
  useGlobalShortcuts()
  return null
}

export function AppShell() {
  useIdentifyUser()
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar (desktop) */}
      <div className="hidden md:flex shrink-0">
        <Sidebar />
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      {/* Global overlays */}
      <CommandPalette />
      <ShortcutsProvider />
    </div>
  )
}
