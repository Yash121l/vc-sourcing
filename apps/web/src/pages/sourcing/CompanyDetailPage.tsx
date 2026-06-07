import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from '@tanstack/react-router'
import {
  ArrowLeft,
  Globe,
  Linkedin,
  ExternalLink,
  UserCircle,
  Mail,
  Newspaper,
  DollarSign,
  Users,
  Package,
  MessageSquare,
  Shield,
  TrendingUp,
  Sparkles,
  AlertTriangle,
  ChevronDown,
  Building2,
  MapPin,
  Calendar,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { companiesApi } from '@/lib/api'
import {
  cn,
  formatCurrency,
  formatRelativeTime,
  formatDate,
  STATUS_CONFIG,
  STAGE_CONFIG,
  SECTOR_CONFIG,
  SIGNAL_CONFIG,
} from '@/lib/utils'
import type { Company, Contact, Signal, CompanyStatus, SignalType } from '@vc/types'

const API_URL = import.meta.env['VITE_API_URL'] ?? 'http://localhost:8787'

// ─── Status options for the dropdown ─────────────────────────────────────────

const STATUS_OPTIONS: CompanyStatus[] = [
  'radar',
  'contacted',
  'engaged',
  'screening',
  'watch',
  'proceeding',
  'passed',
]

// ─── Signal icon map ──────────────────────────────────────────────────────────

function SignalIcon({
  type,
  className,
  style,
}: {
  type: SignalType
  className?: string
  style?: React.CSSProperties
}) {
  const iconProps = { className: cn('size-4', className), style }
  switch (type) {
    case 'news':       return <Newspaper {...iconProps} />
    case 'funding':    return <DollarSign {...iconProps} />
    case 'hiring':     return <Users {...iconProps} />
    case 'product':    return <Package {...iconProps} />
    case 'social':     return <MessageSquare {...iconProps} />
    case 'regulatory': return <Shield {...iconProps} />
    default:           return <Newspaper {...iconProps} />
  }
}

// ─── Metric card ─────────────────────────────────────────────────────────────

function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
        <p className="text-xl font-semibold font-display">{value}</p>
        {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  )
}

// ─── Status selector dropdown ─────────────────────────────────────────────────

function StatusSelector({
  currentStatus,
  onSelect,
  loading,
}: {
  currentStatus: CompanyStatus
  onSelect: (s: CompanyStatus) => void
  loading: boolean
}) {
  const [open, setOpen] = useState(false)
  const cfg = STATUS_CONFIG[currentStatus]

  return (
    <div className="relative">
      <button
        type="button"
        disabled={loading}
        onClick={() => setOpen(v => !v)}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-opacity',
          loading && 'opacity-60 cursor-not-allowed',
        )}
        style={{ background: cfg.bg, color: cfg.color }}
      >
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: cfg.color }} />
        {cfg.label}
        <ChevronDown className="size-3" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.1 }}
              className="absolute right-0 top-full mt-1.5 z-50 w-40 rounded-lg border border-border bg-card shadow-lg overflow-hidden"
            >
              {STATUS_OPTIONS.map(status => {
                const c = STATUS_CONFIG[status]
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => { onSelect(status); setOpen(false) }}
                    className={cn(
                      'flex w-full items-center gap-2 px-3 py-2 text-xs font-medium transition-colors hover:bg-accent',
                      status === currentStatus && 'bg-accent',
                    )}
                  >
                    <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: c.color }} />
                    {c.label}
                  </button>
                )
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── AI Pre-screen panel ──────────────────────────────────────────────────────

function AIPreScreenPanel({ company }: { company: Company }) {
  const score = company.ai_pre_score

  if (score == null) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="size-4 text-muted-foreground" />
            AI Pre-Screen
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-5">
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <AlertTriangle className="size-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">Not yet pre-screened</p>
            <Button size="sm" variant="outline" className="gap-1.5">
              <Sparkles className="size-3.5" /> Run AI Pre-Screen
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const scoreColor =
    score >= 70 ? '#10b981'
    : score >= 50 ? '#f59e0b'
    : '#ef4444'

  const scoreLabel =
    score >= 70 ? 'Strong signal'
    : score >= 50 ? 'Moderate signal'
    : 'Weak signal'

  const pct = Math.min(100, Math.max(0, score))

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="size-4" style={{ color: scoreColor }} />
            AI Pre-Screen
          </CardTitle>
          <div className="flex items-baseline gap-1">
            <span className="font-display text-2xl font-light" style={{ color: scoreColor }}>
              {score}
            </span>
            <span className="text-xs text-muted-foreground">/100</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-5 space-y-3">
        {/* Score bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">Signal strength</span>
            <span className="font-semibold" style={{ color: scoreColor }}>{scoreLabel}</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: scoreColor }}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Summary */}
        {company.ai_pre_summary && (
          <p className="text-xs text-muted-foreground leading-relaxed">
            {company.ai_pre_summary}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Contacts section ─────────────────────────────────────────────────────────

function ContactsCard({ contacts }: { contacts: Contact[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Users className="size-4 text-muted-foreground" />
          Team
          <span className="ml-auto text-xs font-normal text-muted-foreground">{contacts.length}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-5">
        {contacts.length === 0 ? (
          <div className="py-6 text-center">
            <UserCircle className="size-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">No contacts added yet</p>
          </div>
        ) : (
          <div className="divide-y divide-border -mx-5">
            {contacts.map((contact, idx) => (
              <motion.div
                key={contact.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="flex items-start gap-3 px-5 py-3"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                  <UserCircle className="size-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium">{contact.name}</p>
                    {contact.is_founder && (
                      <Badge variant="purple" className="text-[10px] px-1.5 py-0">Founder</Badge>
                    )}
                  </div>
                  {contact.title && (
                    <p className="text-xs text-muted-foreground">{contact.title}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    {contact.email && (
                      <a
                        href={`mailto:${contact.email}`}
                        className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Mail className="size-3" />
                        {contact.email}
                      </a>
                    )}
                    {contact.linkedin_url && (
                      <a
                        href={contact.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-blue-500 hover:text-blue-400 transition-colors"
                      >
                        <Linkedin className="size-3" />
                        LinkedIn
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Signals section ──────────────────────────────────────────────────────────

function SignalsCard({ signals }: { signals: Signal[] }) {
  const sentimentDot = (sentiment: Signal['sentiment']) =>
    sentiment === 'positive' ? '#10b981'
    : sentiment === 'negative' ? '#ef4444'
    : '#64748b'

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingUp className="size-4 text-muted-foreground" />
          Signals
          <span className="ml-auto text-xs font-normal text-muted-foreground">{signals.length}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-5">
        {signals.length === 0 ? (
          <div className="py-6 text-center">
            <TrendingUp className="size-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">No signals yet</p>
          </div>
        ) : (
          <div className="divide-y divide-border -mx-5">
            {signals.map((signal, idx) => {
              const cfg = SIGNAL_CONFIG[signal.type]
              return (
                <motion.div
                  key={signal.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="flex items-start gap-3 px-5 py-3"
                >
                  {/* Type icon */}
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md mt-0.5"
                    style={{ background: `${cfg.color}18` }}
                  >
                    <SignalIcon type={signal.type} className="size-3.5" style={{ color: cfg.color } as React.CSSProperties} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-snug">
                          {signal.url ? (
                            <a
                              href={signal.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline underline-offset-2"
                            >
                              {signal.title}
                            </a>
                          ) : signal.title}
                        </p>
                        {signal.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {signal.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          {/* Sentiment dot */}
                          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                            <span
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ background: sentimentDot(signal.sentiment) }}
                            />
                            {signal.sentiment}
                          </span>
                          {/* Type badge */}
                          <span
                            className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                            style={{ background: `${cfg.color}18`, color: cfg.color }}
                          >
                            {cfg.label}
                          </span>
                          {signal.source_name && (
                            <span className="text-[10px] text-muted-foreground">{signal.source_name}</span>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                        {formatRelativeTime(signal.detected_at)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="Company Detail" />
      <div className="flex-1 p-6 max-w-[1400px] mx-auto w-full space-y-6">
        {/* Header skeleton */}
        <div className="flex items-start gap-4">
          <Skeleton className="h-14 w-14 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
        {/* Metrics row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
        {/* Content columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-36 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function CompanyDetailPage() {
  const { id } = useParams({ from: '/sourcing/companies/$id' })
  const qc = useQueryClient()

  // Queries
  const {
    data: company,
    isLoading: companyLoading,
    isError: companyError,
  } = useQuery({
    queryKey: ['companies', id],
    queryFn: () => companiesApi.get(id),
    enabled: !!id,
  })

  const { data: contacts = [], isLoading: contactsLoading } = useQuery({
    queryKey: ['companies', id, 'contacts'],
    queryFn: () => companiesApi.getContacts(id),
    enabled: !!id,
  })

  const { data: signals = [], isLoading: signalsLoading } = useQuery({
    queryKey: ['companies', id, 'signals'],
    queryFn: () => companiesApi.getSignals(id),
    enabled: !!id,
  })

  // Status mutation
  const updateStatus = useMutation({
    mutationFn: (status: CompanyStatus) =>
      fetch(`${API_URL}/api/companies/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }).then(async res => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({})) as { error?: { message?: string } }
          throw new Error(body.error?.message ?? `Request failed: ${res.status}`)
        }
        return res.json()
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['companies', id] })
      void qc.invalidateQueries({ queryKey: ['companies'] })
    },
  })

  // Pending ID
  if (!id) {
    return (
      <div className="flex flex-col min-h-full items-center justify-center gap-4">
        <p className="text-sm text-muted-foreground">Invalid company link.</p>
        <Link to="/sourcing">
          <Button variant="outline" size="sm" className="gap-1.5">
            <ArrowLeft className="size-3.5" /> Back to Pipeline
          </Button>
        </Link>
      </div>
    )
  }

  if (companyLoading) return <PageSkeleton />

  if (companyError || !company) {
    return (
      <div className="flex flex-col min-h-full">
        <TopBar title="Company Not Found" />
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <Building2 className="size-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Could not load company data.</p>
          <Link to="/sourcing">
            <Button variant="outline" size="sm" className="gap-1.5">
              <ArrowLeft className="size-3.5" /> Back to Pipeline
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const stage = STAGE_CONFIG[company.stage]
  const sector = SECTOR_CONFIG[company.sector]
  const initials = company.name.slice(0, 2).toUpperCase()

  return (
    <motion.div
      className="flex flex-col min-h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <TopBar
        title={company.name}
        subtitle="Company Profile"
        actions={
          <div className="flex items-center gap-2">
            <Link to="/sourcing">
              <Button variant="outline" size="sm" className="gap-1.5">
                <ArrowLeft className="size-3.5" /> Pipeline
              </Button>
            </Link>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-6">

          {/* ── Company header ─────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="flex items-start gap-4 flex-wrap"
          >
            {/* Initials avatar */}
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-muted text-lg font-bold uppercase tracking-tight">
              {initials}
            </div>

            {/* Name + meta */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="font-display text-xl font-semibold">{company.name}</h2>

                {/* Stage badge */}
                <span
                  className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: stage.color + '20', color: stage.color }}
                >
                  {stage.label}
                </span>

                {/* Sector label (text, no emoji) */}
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {sector.label}
                </span>
              </div>

              {/* Location + founded */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                {(company.city ?? company.geography) && (
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3" />
                    {[company.city, company.geography].filter(Boolean).join(', ')}
                  </span>
                )}
                {company.founded_year != null && (
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3" />
                    Founded {company.founded_year}
                  </span>
                )}
                <span className="text-muted-foreground/50">
                  Added {formatDate(company.created_at)}
                </span>
              </div>
            </div>

            {/* Right-side: status + external links */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Status selector */}
              <StatusSelector
                currentStatus={company.status}
                onSelect={s => updateStatus.mutate(s)}
                loading={updateStatus.isPending}
              />

              {/* External link buttons */}
              {company.website && (
                <a href={company.website} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="icon-sm" title="Website">
                    <Globe className="size-3.5" />
                  </Button>
                </a>
              )}
              {company.linkedin_url && (
                <a href={company.linkedin_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="icon-sm" title="LinkedIn">
                    <Linkedin className="size-3.5" />
                  </Button>
                </a>
              )}
              {company.crunchbase_url && (
                <a href={company.crunchbase_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="icon-sm" title="Crunchbase">
                    <ExternalLink className="size-3.5" />
                  </Button>
                </a>
              )}

              {/* Start screening shortcut */}
              {company.status !== 'passed' && company.status !== 'proceeding' && (
                <Link to="/screening">
                  <Button size="sm" variant="secondary" className="gap-1.5">
                    Start Screening
                  </Button>
                </Link>
              )}
            </div>
          </motion.div>

          {/* ── Metrics row ────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4"
          >
            <MetricCard
              label="ARR"
              value={formatCurrency(company.arr_usd, { compact: true })}
              sub="Annual recurring revenue"
            />
            <MetricCard
              label="MRR"
              value={formatCurrency(company.mrr_usd, { compact: true })}
              sub="Monthly recurring revenue"
            />
            <MetricCard
              label="MoM Growth"
              value={company.growth_rate_pct != null ? `${company.growth_rate_pct}%` : '—'}
              sub="Month-over-month"
            />
            <MetricCard
              label="Team Size"
              value={company.team_size != null ? String(company.team_size) : '—'}
              sub="Employees"
            />
          </motion.div>

          {/* ── Two-column layout ──────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left column (2/3 width) */}
            <div className="lg:col-span-2 space-y-6">

              {/* Description */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Building2 className="size-4 text-muted-foreground" />
                      About
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-5">
                    {company.description ? (
                      <p className="text-sm text-foreground leading-relaxed">{company.description}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No description available.</p>
                    )}

                    {/* Source info */}
                    <div className="mt-4 pt-4 border-t border-border flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>
                        <span className="font-medium text-foreground">Source: </span>
                        {company.source_type.replace(/_/g, ' ')}
                      </span>
                      {company.source_detail && (
                        <span>
                          <span className="font-medium text-foreground">Detail: </span>
                          {company.source_detail}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Signals */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {signalsLoading ? (
                  <Card>
                    <CardHeader>
                      <Skeleton className="h-4 w-24" />
                    </CardHeader>
                    <CardContent className="pb-5 space-y-3">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="flex gap-3">
                          <Skeleton className="h-7 w-7 rounded-md shrink-0" />
                          <div className="flex-1 space-y-1.5">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ) : (
                  <SignalsCard signals={signals} />
                )}
              </motion.div>
            </div>

            {/* Right column (1/3 width) */}
            <div className="space-y-6">

              {/* AI Pre-screen */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18 }}
              >
                <AIPreScreenPanel company={company} />
              </motion.div>

              {/* Contacts */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22 }}
              >
                {contactsLoading ? (
                  <Card>
                    <CardHeader>
                      <Skeleton className="h-4 w-20" />
                    </CardHeader>
                    <CardContent className="pb-5 space-y-3">
                      {[1, 2].map(i => (
                        <div key={i} className="flex gap-3">
                          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                          <div className="flex-1 space-y-1.5">
                            <Skeleton className="h-4 w-1/2" />
                            <Skeleton className="h-3 w-1/3" />
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ) : (
                  <ContactsCard contacts={contacts} />
                )}
              </motion.div>

              {/* Additional funding info */}
              {(company.funding_total_usd != null || company.last_funding_amount_usd != null) && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.26 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <DollarSign className="size-4 text-muted-foreground" />
                        Funding
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-5 space-y-2">
                      {company.funding_total_usd != null && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Total raised</span>
                          <span className="font-semibold font-mono">
                            {formatCurrency(company.funding_total_usd, { compact: true })}
                          </span>
                        </div>
                      )}
                      {company.last_funding_amount_usd != null && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Last round</span>
                          <span className="font-semibold font-mono">
                            {formatCurrency(company.last_funding_amount_usd, { compact: true })}
                          </span>
                        </div>
                      )}
                      {company.last_funding_type && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Round type</span>
                          <span className="font-medium">{company.last_funding_type}</span>
                        </div>
                      )}
                      {company.last_funding_date && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Date</span>
                          <span className="text-muted-foreground">{formatDate(company.last_funding_date)}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Pass reason (if applicable) */}
              {company.status === 'passed' && company.pass_reason && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.28 }}
                >
                  <Card className="border-destructive/30">
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                        <AlertTriangle className="size-4" />
                        Pass Rationale
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-5">
                      <p className="text-xs text-muted-foreground leading-relaxed">{company.pass_reason}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
