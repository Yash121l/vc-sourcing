import { Sun, Moon, Monitor, Bell, Search } from 'lucide-react'
import { useThemeStore } from '@/stores/theme'
import { useUIStore } from '@/stores/ui'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Theme = 'light' | 'dark' | 'system'

function ThemeButton({ value, icon: Icon, label }: { value: Theme; icon: React.ElementType; label: string }) {
  const { theme, setTheme } = useThemeStore()
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={() => setTheme(value)}
      title={label}
      className={cn(theme === value && 'bg-accent text-foreground')}
    >
      <Icon className="size-3.5" />
    </Button>
  )
}

interface TopBarProps {
  title?: string
  subtitle?: string
  actions?: React.ReactNode
}

export function TopBar({ title, subtitle, actions }: TopBarProps) {
  const { openCommandPalette } = useUIStore()

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-border bg-background/95 backdrop-blur px-6">
      {/* Title area */}
      <div className="flex-1 min-w-0">
        {title && (
          <div className="flex items-baseline gap-2">
            <h1 className="text-sm font-semibold truncate">{title}</h1>
            {subtitle && <span className="text-xs text-muted-foreground hidden sm:block">{subtitle}</span>}
          </div>
        )}
      </div>

      {/* Global search trigger */}
      <button
        type="button"
        onClick={openCommandPalette}
        className="hidden md:flex items-center gap-2 h-8 w-64 rounded-md border border-border bg-muted/50 px-3 text-xs text-muted-foreground hover:border-input hover:bg-muted transition-colors"
      >
        <Search className="size-3.5 shrink-0" />
        <span className="flex-1 text-left">Search companies...</span>
        <kbd className="text-[10px] font-mono bg-background border border-border rounded px-1 py-0.5 shrink-0">
          ⌘K
        </kbd>
      </button>

      {/* Actions */}
      {actions && <div className="flex items-center gap-2">{actions}</div>}

      {/* Theme + notifications */}
      <div className="flex items-center gap-1">
        <div className="flex items-center rounded-md border border-border p-0.5">
          <ThemeButton value="light"  icon={Sun}     label="Light mode" />
          <ThemeButton value="system" icon={Monitor} label="System theme" />
          <ThemeButton value="dark"   icon={Moon}    label="Dark mode" />
        </div>
        <Button variant="ghost" size="icon-sm" title="Notifications">
          <Bell className="size-3.5" />
        </Button>
      </div>
    </header>
  )
}
