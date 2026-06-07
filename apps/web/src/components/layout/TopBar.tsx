import { Sun, Moon, Monitor, Bell, Search } from 'lucide-react'
import { useThemeStore } from '@/stores/theme'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

      {/* Search */}
      <div className="hidden md:flex w-64">
        <Input
          placeholder="Search companies..."
          leftIcon={<Search />}
          className="h-8 text-xs"
        />
      </div>

      {/* Actions */}
      {actions && <div className="flex items-center gap-2">{actions}</div>}

      {/* Theme + notifications */}
      <div className="flex items-center gap-1">
        <div className="flex items-center rounded-md border border-border p-0.5">
          <ThemeButton value="light" icon={Sun} label="Light mode" />
          <ThemeButton value="system" icon={Monitor} label="System theme" />
          <ThemeButton value="dark" icon={Moon} label="Dark mode" />
        </div>
        <Button variant="ghost" size="icon-sm" title="Notifications">
          <Bell className="size-3.5" />
        </Button>
      </div>
    </header>
  )
}
