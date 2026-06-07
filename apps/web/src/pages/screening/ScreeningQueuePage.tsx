import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Filter, Plus, Clock, CheckCircle2, CircleDot } from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { screeningsApi } from '@/lib/api'
import { SECTOR_CONFIG, STAGE_CONFIG, formatDate, computeOverallScore, scoreColor } from '@/lib/utils'
import type { Screening, ScreeningStatus } from '@vc/types'

function ScreeningCard({ screening }: { screening: Screening }) {
  const company = screening.company
  if (!company) return null

  const scores = {
    team: screening.score_team,
    market: screening.score_market,
    product: screening.score_product,
    traction: screening.score_traction,
    business_model: screening.score_business_model,
    investment_fit: screening.score_investment_fit,
  }
  const hasScores = Object.values(scores).some(v => v != null)
  const overall = screening.overall_score ?? computeOverallScore(scores)
  const color = scoreColor(overall)

  const statusIcon = {
    queued: <Clock className="size-3.5 text-muted-foreground" />,
    in_progress: <CircleDot className="size-3.5 text-blue-500" />,
    completed: <CheckCircle2 className="size-3.5 text-emerald-500" />,
  }[screening.status]

  const decisionVariant = {
    pass: 'destructive' as const,
    proceed: 'success' as const,
    watch: 'warning' as const,
  }

  return (
    <Link to="/screening/$id" params={{ id: screening.id }}>
      <div className="kanban-card rounded-xl border border-border bg-card p-4 cursor-pointer">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/15 text-sm font-bold uppercase text-indigo-400">
              {company.name.slice(0, 2)}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{company.name}</p>
              <p className="text-xs text-muted-foreground">
                {SECTOR_CONFIG[company.sector]?.label} · {STAGE_CONFIG[company.stage]?.label}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <div className="flex items-center gap-1">{statusIcon}</div>
            {hasScores && (
              <span className="font-display text-lg font-light" style={{ color }}>{overall.toFixed(1)}</span>
            )}
          </div>
        </div>

        {hasScores && (
          <div className="mb-3">
            <Progress value={(overall / 10) * 100} className="h-1" indicatorClassName={``}
              style={{ '--tw-bg': color } as React.CSSProperties} />
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {screening.decision && (
              <Badge variant={decisionVariant[screening.decision]} className="text-[10px]">
                {screening.decision === 'proceed' ? '→ DD' : screening.decision}
              </Badge>
            )}
            {!screening.decision && screening.status !== 'completed' && (
              <Badge variant="outline" className="text-[10px]">Awaiting decision</Badge>
            )}
          </div>
          <span className="text-[10px] text-muted-foreground">{formatDate(screening.created_at)}</span>
        </div>
      </div>
    </Link>
  )
}

function EmptyState({ status }: { status: ScreeningStatus }) {
  return (
    <div className="py-16 text-center">
      <Filter className="size-8 text-muted-foreground mx-auto mb-3" />
      <p className="text-sm text-muted-foreground">
        {status === 'queued' ? 'No companies in the screening queue' :
         status === 'in_progress' ? 'No screenings in progress' :
         'No completed screenings'}
      </p>
    </div>
  )
}

export function ScreeningQueuePage() {
  const { data: allScreenings = [], isLoading } = useQuery({
    queryKey: ['screenings'],
    queryFn: () => screeningsApi.list(),
  })

  const byStatus = {
    queued: allScreenings.filter(s => s.status === 'queued'),
    in_progress: allScreenings.filter(s => s.status === 'in_progress'),
    completed: allScreenings.filter(s => s.status === 'completed'),
  }

  return (
    <div className="flex flex-col min-h-full">
      <TopBar
        title="Initial Screening"
        subtitle="Phase 02 — 48–72hr rapid pass / no-pass decision"
        actions={
          <Badge variant="purple" className="gap-1.5 text-xs">
            <span className="font-display font-light">02</span> Screening
          </Badge>
        }
      />

      <div className="flex-1 p-6 max-w-5xl mx-auto w-full">
        <Tabs defaultValue="queued">
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="queued" className="gap-1.5">
                <Clock className="size-3.5" /> Queue
                {byStatus.queued.length > 0 && (
                  <span className="ml-1 bg-muted rounded-full px-1.5 text-[10px] font-bold">
                    {byStatus.queued.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="in_progress" className="gap-1.5">
                <CircleDot className="size-3.5" /> In Progress
              </TabsTrigger>
              <TabsTrigger value="completed" className="gap-1.5">
                <CheckCircle2 className="size-3.5" /> Completed
              </TabsTrigger>
            </TabsList>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
            </div>
          ) : (
            <>
              {(['queued', 'in_progress', 'completed'] as ScreeningStatus[]).map(status => (
                <TabsContent key={status} value={status}>
                  {byStatus[status].length === 0 ? (
                    <EmptyState status={status} />
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {byStatus[status].map(s => <ScreeningCard key={s.id} screening={s} />)}
                    </div>
                  )}
                </TabsContent>
              ))}
            </>
          )}
        </Tabs>
      </div>
    </div>
  )
}
