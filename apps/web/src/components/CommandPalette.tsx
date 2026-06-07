import { useState, useEffect, useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import {
  Search, LayoutDashboard, TrendingUp, Telescope, Zap,
  Filter, FileText, Bot, Settings, Building2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/ui'
import { companiesApi } from '@/lib/api'
import type { Company } from '@vc/types'

interface NavCommand {
  id: string
  type: 'nav'
  label: string
  shortcut?: string
  icon: LucideIcon
  href: string
}

interface CompanyCommand {
  id: string
  type: 'company'
  label: string
  sublabel: string
  icon: LucideIcon
  companyId: string
}

type CommandItem = NavCommand | CompanyCommand

const NAV_COMMANDS: NavCommand[] = [
  { id: 'nav-home',      type: 'nav', label: 'Dashboard',       shortcut: 'G H', icon: LayoutDashboard, href: '/' },
  { id: 'nav-pipeline',  type: 'nav', label: 'Pipeline',        shortcut: 'G P', icon: TrendingUp,      href: '/sourcing' },
  { id: 'nav-discover',  type: 'nav', label: 'Discover',        shortcut: 'G D', icon: Telescope,       href: '/sourcing/discover' },
  { id: 'nav-signals',   type: 'nav', label: 'Signals',         shortcut: 'G S', icon: Zap,             href: '/sourcing/signals' },
  { id: 'nav-screening', type: 'nav', label: 'Screening Queue', shortcut: 'G Q', icon: Filter,          href: '/screening' },
  { id: 'nav-memos',     type: 'nav', label: 'IC Memos',                         icon: FileText,        href: '/screening/memos' },
  { id: 'nav-agents',    type: 'nav', label: 'AI Agents',                        icon: Bot,             href: '/agents' },
  { id: 'nav-settings',  type: 'nav', label: 'Settings',                         icon: Settings,        href: '/settings' },
]

function CommandRow({
  item,
  isSelected,
  onSelect,
  onHover,
}: {
  item: CommandItem
  isSelected: boolean
  onSelect: () => void
  onHover: () => void
}) {
  const Icon = item.icon
  return (
    <button
      type="button"
      className={cn(
        'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
        isSelected
          ? 'bg-accent text-foreground'
          : 'text-foreground hover:bg-accent/50',
      )}
      onMouseEnter={onHover}
      onClick={onSelect}
    >
      <Icon className="size-4 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.label}</p>
        {item.type === 'company' && (
          <p className="text-[11px] text-muted-foreground truncate">{item.sublabel}</p>
        )}
      </div>
      {item.type === 'nav' && item.shortcut && (
        <div className="flex items-center gap-0.5 shrink-0">
          {item.shortcut.split(' ').map((k, i) => (
            <kbd
              key={i}
              className="text-[9px] font-mono bg-muted border border-border rounded px-1 py-0.5 text-muted-foreground"
            >
              {k}
            </kbd>
          ))}
        </div>
      )}
    </button>
  )
}

export function CommandPalette() {
  const { commandPaletteOpen, closeCommandPalette } = useUIStore()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const { data: companies = [] } = useQuery({
    queryKey: ['companies-palette', query],
    queryFn: () => companiesApi.list({ search: query || undefined, per_page: 6 }),
    enabled: commandPaletteOpen,
    staleTime: 30_000,
  })

  const navFiltered = query.trim()
    ? NAV_COMMANDS.filter(c => c.label.toLowerCase().includes(query.toLowerCase()))
    : NAV_COMMANDS

  const companyItems: CompanyCommand[] = (companies as Company[]).map(c => ({
    id: `co-${c.id}`,
    type: 'company',
    label: c.name,
    sublabel: [c.city ?? c.geography, c.sector].filter(Boolean).join(' · '),
    icon: Building2,
    companyId: c.id,
  }))

  const allItems: CommandItem[] = [...navFiltered, ...companyItems]

  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery('')
      setSelectedIndex(0)
      const t = setTimeout(() => inputRef.current?.focus(), 50)
      return () => clearTimeout(t)
    }
  }, [commandPaletteOpen])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  useEffect(() => {
    if (!commandPaletteOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { closeCommandPalette(); return }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(i => Math.min(i + 1, allItems.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(i => Math.max(i - 1, 0))
      } else if (e.key === 'Enter') {
        const item = allItems[selectedIndex]
        if (!item) return
        closeCommandPalette()
        if (item.type === 'company') {
          navigate({ to: '/sourcing/companies/$id', params: { id: item.companyId } })
        } else {
          navigate({ to: item.href as Parameters<typeof navigate>[0]['to'] })
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [commandPaletteOpen, allItems, selectedIndex, closeCommandPalette, navigate])

  return (
    <AnimatePresence>
      {commandPaletteOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeCommandPalette}
          />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-lg mx-4 rounded-xl border border-border bg-popover shadow-2xl overflow-hidden"
          >
            {/* Search input */}
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <Search className="size-4 text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search companies or navigate..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <kbd className="text-[10px] font-mono bg-muted border border-border rounded px-1.5 py-0.5 text-muted-foreground shrink-0">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-80 overflow-y-auto">
              {navFiltered.length > 0 && (
                <div>
                  <p className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                    Navigation
                  </p>
                  {navFiltered.map((item, i) => (
                    <CommandRow
                      key={item.id}
                      item={item}
                      isSelected={i === selectedIndex}
                      onSelect={() => {
                        closeCommandPalette()
                        navigate({ to: item.href as Parameters<typeof navigate>[0]['to'] })
                      }}
                      onHover={() => setSelectedIndex(i)}
                    />
                  ))}
                </div>
              )}

              {companyItems.length > 0 && (
                <div>
                  <p className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                    Companies
                  </p>
                  {companyItems.map((item, i) => {
                    const globalIndex = navFiltered.length + i
                    return (
                      <CommandRow
                        key={item.id}
                        item={item}
                        isSelected={globalIndex === selectedIndex}
                        onSelect={() => {
                          closeCommandPalette()
                          navigate({ to: '/sourcing/companies/$id', params: { id: item.companyId } })
                        }}
                        onHover={() => setSelectedIndex(globalIndex)}
                      />
                    )
                  })}
                </div>
              )}

              {allItems.length === 0 && (
                <div className="py-10 text-center">
                  <p className="text-sm text-muted-foreground">No results for &ldquo;{query}&rdquo;</p>
                </div>
              )}
            </div>

            {/* Footer hints */}
            <div className="border-t border-border px-4 py-2 flex items-center gap-4 bg-muted/30">
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <kbd className="font-mono bg-muted border border-border rounded px-1 text-[9px]">↑↓</kbd>
                navigate
              </span>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <kbd className="font-mono bg-muted border border-border rounded px-1 text-[9px]">↵</kbd>
                open
              </span>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <kbd className="font-mono bg-muted border border-border rounded px-1 text-[9px]">G</kbd>
                +
                <kbd className="font-mono bg-muted border border-border rounded px-1 text-[9px]">P/D/S/Q</kbd>
                go to page
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
