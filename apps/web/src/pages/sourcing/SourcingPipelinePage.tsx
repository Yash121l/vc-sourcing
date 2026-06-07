import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { LayoutGrid, List, Plus, ExternalLink, Globe, TrendingUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { companiesApi } from '@/lib/api'
import { STATUS_CONFIG, SECTOR_CONFIG, STAGE_CONFIG, formatCurrency, formatDate } from '@/lib/utils'
import { usePipelineStore } from '@/stores/pipeline'
import type { Company, CompanyStatus } from '@vc/types'

const KANBAN_COLUMNS: { status: CompanyStatus; label: string }[] = [
  { status: 'radar',     label: 'Radar' },
  { status: 'contacted', label: 'Contacted' },
  { status: 'engaged',   label: 'Engaged' },
  { status: 'screening', label: 'Screening' },
]

function CompanyCard({ company }: { company: Company }) {
  const sector = SECTOR_CONFIG[company.sector]
  const stage = STAGE_CONFIG[company.stage]
  const SectorIcon = sector.icon

  return (
    <Link to="/sourcing/companies/$id" params={{ id: company.id }}>
      <div className="kanban-card rounded-lg border border-border bg-card p-3 cursor-pointer">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-bold uppercase">
              {company.name.slice(0, 2)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate leading-tight">{company.name}</p>
              <p className="text-[10px] text-muted-foreground">{company.city ?? company.geography ?? 'Unknown'}</p>
            </div>
          </div>
          <SectorIcon className="size-4 text-muted-foreground shrink-0" />
        </div>

        {company.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{company.description}</p>
        )}

        <div className="flex flex-wrap items-center gap-1">
          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
            style={{ background: stage.color + '20', color: stage.color }}>
            {stage.label}
          </span>
          {company.arr_usd != null && (
            <span className="text-[10px] text-muted-foreground">
              ARR {formatCurrency(company.arr_usd, { compact: true })}
            </span>
          )}
          {company.growth_rate_pct != null && (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-500">
              <TrendingUp className="size-2.5" /> {company.growth_rate_pct}%
            </span>
          )}
        </div>

        <p className="mt-2 text-[10px] text-muted-foreground/60">{formatDate(company.created_at)}</p>
      </div>
    </Link>
  )
}

function KanbanView({ companies }: { companies: Company[] }) {
  return (
    <div className="flex gap-4 h-full overflow-x-auto pb-4">
      {KANBAN_COLUMNS.map(col => {
        const cards = companies.filter(c => c.status === col.status)
        const cfg = STATUS_CONFIG[col.status]
        return (
          <div key={col.status} className="flex flex-col w-72 shrink-0">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full" style={{ background: cfg.color }} />
                <span className="text-xs font-semibold">{col.label}</span>
              </div>
              <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">{cards.length}</span>
            </div>
            <div className="flex flex-col gap-2 flex-1 overflow-y-auto">
              <AnimatePresence>
                {cards.map(company => (
                  <motion.div
                    key={company.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <CompanyCard company={company} />
                  </motion.div>
                ))}
              </AnimatePresence>
              {cards.length === 0 && (
                <div className="rounded-lg border-2 border-dashed border-border p-4 text-center">
                  <p className="text-xs text-muted-foreground">No companies</p>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ListView({ companies }: { companies: Company[] }) {
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Company</th>
            <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground hidden sm:table-cell">Sector</th>
            <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground hidden md:table-cell">Stage</th>
            <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground hidden lg:table-cell">ARR</th>
            <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Status</th>
            <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground hidden xl:table-cell">Source</th>
            <th className="px-4 py-2.5" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {companies.map(company => {
            const cfg = STATUS_CONFIG[company.status]
            const sector = SECTOR_CONFIG[company.sector]
            const stage = STAGE_CONFIG[company.stage]
            return (
              <tr key={company.id} className="hover:bg-muted/30 transition-colors group">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 shrink-0 rounded-md bg-muted flex items-center justify-center text-xs font-bold uppercase">
                      {company.name.slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-medium">{company.name}</p>
                      {company.city && <p className="text-xs text-muted-foreground">{company.city}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  {(() => { const SectorIcon = sector.icon; return (
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <SectorIcon className="size-3.5" /> {sector.label}
                    </span>
                  )})()}
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: stage.color + '20', color: stage.color }}>
                    {stage.label}
                  </span>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <span className="text-xs font-mono">{formatCurrency(company.arr_usd, { compact: true })}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                    style={{ background: cfg.bg, color: cfg.color }}>
                    {cfg.label}
                  </span>
                </td>
                <td className="px-4 py-3 hidden xl:table-cell text-xs text-muted-foreground">
                  {company.source_type.replace('_', ' ')}
                </td>
                <td className="px-4 py-3">
                  <Link to="/sourcing/companies/$id" params={{ id: company.id }}>
                    <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100">
                      <ExternalLink className="size-3.5" />
                    </Button>
                  </Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {companies.length === 0 && (
        <div className="py-16 text-center text-sm text-muted-foreground">
          No companies match the current filters
        </div>
      )}
    </div>
  )
}

export function SourcingPipelinePage() {
  const { viewMode, setViewMode, filters } = usePipelineStore()
  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['companies', filters],
    queryFn: () => companiesApi.list({
      status: filters.status.length ? filters.status : KANBAN_COLUMNS.map(c => c.status),
      sector: filters.sector.length ? filters.sector : undefined,
      stage: filters.stage.length ? filters.stage : undefined,
      search: filters.search || undefined,
    }),
  })

  return (
    <div className="flex flex-col h-full">
      <TopBar
        title="Deal Sourcing Pipeline"
        subtitle="Build & qualify the deal pipeline"
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-md border border-border p-0.5">
              <Button
                variant="ghost" size="icon-sm"
                className={viewMode === 'kanban' ? 'bg-accent' : ''}
                onClick={() => setViewMode('kanban')}
              >
                <LayoutGrid className="size-3.5" />
              </Button>
              <Button
                variant="ghost" size="icon-sm"
                className={viewMode === 'list' ? 'bg-accent' : ''}
                onClick={() => setViewMode('list')}
              >
                <List className="size-3.5" />
              </Button>
            </div>
            <Link to="/sourcing/discover">
              <Button size="sm" className="gap-1.5">
                <Plus className="size-3.5" /> Add Company
              </Button>
            </Link>
          </div>
        }
      />

      <div className={`flex-1 p-6 ${viewMode === 'kanban' ? 'overflow-hidden' : 'overflow-y-auto'}`}>
        {isLoading ? (
          <div className="grid grid-cols-4 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-6 w-24" />
                {[1,2,3].map(j => <Skeleton key={j} className="h-32 w-full" />)}
              </div>
            ))}
          </div>
        ) : viewMode === 'kanban' ? (
          <KanbanView companies={companies} />
        ) : (
          <ListView companies={companies} />
        )}
      </div>
    </div>
  )
}
