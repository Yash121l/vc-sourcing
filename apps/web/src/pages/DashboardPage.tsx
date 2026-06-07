import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import {
  TrendingUp, Filter, Zap, ArrowRight,
  Users, Building2, CheckCircle, Eye
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TopBar } from '@/components/layout/TopBar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { companiesApi, signalsApi } from '@/lib/api'
import { STATUS_CONFIG, SECTOR_CONFIG, formatDate, formatRelativeTime } from '@/lib/utils'
import type { CompanyStatus } from '@vc/types'

const PIPELINE_STAGES: CompanyStatus[] = ['radar', 'contacted', 'engaged', 'screening']

function StatCard({ label, value, icon: Icon, color, href }: {
  label: string; value: number | string; icon: React.ElementType; color: string; href?: string
}) {
  const content = (
    <Card className="group transition-shadow hover:shadow-md">
      <CardContent className="pt-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
            <p className="mt-1 font-display text-3xl font-light" style={{ color }}>{value}</p>
          </div>
          <div className="rounded-lg p-2.5" style={{ background: `${color}15` }}>
            <Icon className="size-5" style={{ color }} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
  return href ? <Link to={href}>{content}</Link> : content
}

export function DashboardPage() {
  const { data: companies = [], isLoading: loadingCompanies } = useQuery({
    queryKey: ['companies'],
    queryFn: () => companiesApi.list({ per_page: 100 }),
  })

  const { data: signals = [], isLoading: loadingSignals } = useQuery({
    queryKey: ['signals'],
    queryFn: () => signalsApi.list(),
  })

  const byStatus = PIPELINE_STAGES.reduce((acc, s) => {
    acc[s] = companies.filter(c => c.status === s).length
    return acc
  }, {} as Record<string, number>)

  const bySector = Object.entries(
    companies.reduce((acc, c) => { acc[c.sector] = (acc[c.sector] ?? 0) + 1; return acc }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1]).slice(0, 6)

  const COLORS = ['#7c3aed', '#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444']
  const unread = signals.filter(s => !s.is_read).length

  return (
    <div className="flex flex-col min-h-full">
      <TopBar
        title="Dashboard"
        subtitle="Deal flow overview"
        actions={
          <Link to="/sourcing/discover">
            <Button size="sm" className="gap-1.5">
              <Building2 className="size-3.5" /> Add Company
            </Button>
          </Link>
        }
      />

      <div className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Hero stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Pipeline" value={companies.length} icon={TrendingUp} color="#7c3aed" href="/sourcing" />
          <StatCard label="In Screening" value={byStatus['screening'] ?? 0} icon={Filter} color="#6366f1" href="/screening" />
          <StatCard label="New Signals" value={unread} icon={Zap} color="#f59e0b" href="/sourcing/signals" />
          <StatCard
            label="Proceeding to DD"
            value={companies.filter(c => c.status === 'proceeding').length}
            icon={CheckCircle} color="#10b981"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pipeline funnel */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm">Pipeline by Stage</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingCompanies ? (
                <div className="space-y-3">
                  {[1,2,3,4].map(i => <Skeleton key={i} className="h-8 w-full" />)}
                </div>
              ) : (
                <div className="space-y-2">
                  {PIPELINE_STAGES.map(status => {
                    const count = byStatus[status] ?? 0
                    const max = Math.max(...Object.values(byStatus), 1)
                    const cfg = STATUS_CONFIG[status]
                    return (
                      <div key={status} className="flex items-center gap-3">
                        <span className="w-24 text-xs text-muted-foreground shrink-0">{cfg.label}</span>
                        <div className="flex-1 h-6 rounded-md bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-md transition-all duration-500 flex items-center px-2"
                            style={{ width: `${(count / max) * 100}%`, background: cfg.color + '40', minWidth: count > 0 ? '2rem' : 0 }}
                          >
                            {count > 0 && (
                              <span className="text-xs font-bold" style={{ color: cfg.color }}>{count}</span>
                            )}
                          </div>
                        </div>
                        <span className="w-6 text-xs font-semibold text-right">{count}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* By sector */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">By Sector</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingCompanies ? (
                <Skeleton className="h-40 w-full" />
              ) : bySector.length === 0 ? (
                <p className="text-sm text-muted-foreground">No data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={bySector.map(([name, value]) => ({ name, value }))} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                      {bySector.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v, n) => [v, SECTOR_CONFIG[n as keyof typeof SECTOR_CONFIG]?.label ?? n]} />
                  </PieChart>
                </ResponsiveContainer>
              )}
              <div className="mt-2 space-y-1">
                {bySector.slice(0, 4).map(([sector, count], i) => (
                  <div key={sector} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block h-2 w-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      {SECTOR_CONFIG[sector as keyof typeof SECTOR_CONFIG]?.label ?? sector}
                    </span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent signals */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-sm">Recent Signals</CardTitle>
            <Link to="/sourcing/signals">
              <Button variant="ghost" size="sm" className="text-xs gap-1">
                View all <ArrowRight className="size-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loadingSignals ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : signals.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No signals yet</p>
            ) : (
              <div className="divide-y divide-border">
                {signals.slice(0, 5).map(signal => (
                  <div key={signal.id} className="flex items-start gap-3 py-3">
                    <div className={`mt-0.5 flex-shrink-0 h-2 w-2 rounded-full mt-1.5 ${!signal.is_read ? 'bg-blue-500' : 'bg-muted'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{signal.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {signal.source_name ?? 'Unknown source'} · {formatRelativeTime(signal.detected_at)}
                      </p>
                    </div>
                    <Badge variant={signal.sentiment === 'positive' ? 'success' : signal.sentiment === 'negative' ? 'destructive' : 'secondary'}>
                      {signal.sentiment}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
