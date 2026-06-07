import { Link, useRouterState } from '@tanstack/react-router'
import {
  LayoutDashboard, Search, Zap, FileText, ChevronLeft, ChevronRight,
  TrendingUp, Bot, Settings, Telescope, Filter
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePipelineStore } from '@/stores/pipeline'
import { Button } from '@/components/ui/button'

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { type: 'section', label: '01 Deal Sourcing' },
  { label: 'Pipeline', href: '/sourcing', icon: TrendingUp, color: '#7c3aed' },
  { label: 'Discover', href: '/sourcing/discover', icon: Telescope, color: '#7c3aed' },
  { label: 'Signals', href: '/sourcing/signals', icon: Zap, color: '#7c3aed' },
  { type: 'section', label: '02 Initial Screening' },
  { label: 'Screening Queue', href: '/screening', icon: Filter, color: '#6366f1' },
  { label: 'IC Memos', href: '/screening/memos', icon: FileText, color: '#6366f1' },
  { type: 'section', label: 'System' },
  { label: 'AI Agents', href: '/agents', icon: Bot },
  { label: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = usePipelineStore()
  const { location } = useRouterState()

  return (
    <aside
      className={cn(
        'relative flex flex-col border-r border-sidebar-border bg-sidebar-bg transition-all duration-200',
        sidebarCollapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className={cn(
        'flex h-14 items-center border-b border-sidebar-border px-4 shrink-0',
        sidebarCollapsed ? 'justify-center' : 'gap-3'
      )}>
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-violet-500/20 shrink-0">
          <span className="font-display text-sm italic text-violet-400 font-medium">vc</span>
        </div>
        {!sidebarCollapsed && (
          <div>
            <p className="text-sm font-semibold leading-none">VC Sourcing</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Deal Flow Platform</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {NAV_ITEMS.map((item, i) => {
          if (item.type === 'section') {
            if (sidebarCollapsed) return <div key={i} className="my-2 border-t border-sidebar-border" />
            return (
              <p key={i} className="px-2 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                {item.label}
              </p>
            )
          }

          const Icon = item.icon!
          const isActive = item.href === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.href!)
          const accentColor = item.color

          return (
            <Link
              key={item.href}
              to={item.href!}
              className={cn(
                'group flex items-center gap-3 rounded-md px-2 py-1.5 text-sm transition-colors',
                'hover:bg-accent hover:text-accent-foreground',
                isActive
                  ? 'bg-accent text-foreground font-medium'
                  : 'text-muted-foreground',
                sidebarCollapsed && 'justify-center px-0'
              )}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <Icon
                className="size-4 shrink-0 transition-colors"
                style={isActive && accentColor ? { color: accentColor } : undefined}
              />
              {!sidebarCollapsed && (
                <span className="truncate">{item.label}</span>
              )}
              {!sidebarCollapsed && isActive && accentColor && (
                <div
                  className="ml-auto h-1.5 w-1.5 rounded-full"
                  style={{ background: accentColor }}
                />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-sidebar-border p-2">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleSidebar}
          className="w-full h-7 text-muted-foreground hover:text-foreground"
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <ChevronRight className="size-3.5" /> : <ChevronLeft className="size-3.5" />}
        </Button>
      </div>
    </aside>
  )
}
