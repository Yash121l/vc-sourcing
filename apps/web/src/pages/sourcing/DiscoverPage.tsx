import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Search, Sparkles, Plus, Globe, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { companiesApi, agentsApi } from '@/lib/api'
import type { CompanySector, CompanyStage, SourceType, AIPreScreenOutput } from '@vc/types'

const SECTORS: CompanySector[] = ['fintech', 'saas', 'consumer', 'deeptech', 'healthtech', 'edtech',
  'ecommerce', 'climate', 'agritech', 'logistics', 'proptech', 'hrtech', 'legaltech', 'other']
const STAGES: CompanyStage[] = ['pre_seed', 'seed', 'series_a', 'series_b', 'growth']
const SOURCES: SourceType[] = ['inbound_portal', 'outbound_search', 'scout_referral', 'co_investor',
  'demo_day', 'conference', 'newsletter', 'linkedin', 'angellist', 'warm_intro']

const schema = z.object({
  name: z.string().min(1, 'Company name is required'),
  website: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  description: z.string().optional(),
  sector: z.enum(['fintech', 'saas', 'consumer', 'deeptech', 'healthtech', 'edtech',
    'ecommerce', 'climate', 'agritech', 'logistics', 'proptech', 'hrtech', 'legaltech', 'other']).optional(),
  stage: z.enum(['pre_seed', 'seed', 'series_a', 'series_b', 'growth', 'unknown']).optional(),
  source_type: z.enum(['inbound_portal', 'outbound_search', 'scout_referral', 'co_investor',
    'demo_day', 'conference', 'newsletter', 'linkedin', 'angellist', 'warm_intro']),
  source_detail: z.string().optional(),
  geography: z.string().optional(),
  city: z.string().optional(),
})

type FormData = z.infer<typeof schema>

function AIScoreCard({ result }: { result: AIPreScreenOutput }) {
  const color = result.score >= 70 ? '#10b981' : result.score >= 50 ? '#f59e0b' : '#ef4444'
  const recColor = result.recommendation === 'advance' ? '#10b981' : result.recommendation === 'watch' ? '#f59e0b' : '#ef4444'

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-2" style={{ borderColor: `${color}40` }}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="size-4" style={{ color }} />
              AI Pre-Screen Result
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="font-display text-2xl font-light" style={{ color }}>{result.score}</span>
              <span className="text-xs text-muted-foreground">/100</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {([
              ['Sector Fit', result.sector_fit],
              ['Team Signal', result.team_signal],
              ['TAM Signal', result.tam_signal],
              ['Traction', result.traction_signal],
            ] as [string, number][]).map(([label, score]) => (
              <div key={label} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-semibold">{score}/10</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${score * 10}%`, background: score >= 7 ? '#10b981' : score >= 5 ? '#f59e0b' : '#ef4444' }} />
                </div>
              </div>
            ))}
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">{result.rationale}</p>

          {result.flags.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1.5">Red Flags</p>
              <div className="space-y-1">
                {result.flags.map((flag, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-destructive">
                    <span>⚠</span> {flag}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <span className="text-xs text-muted-foreground">Recommendation</span>
            <span className="text-sm font-bold uppercase tracking-wide" style={{ color: recColor }}>
              {result.recommendation}
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function DiscoverPage() {
  const [aiResult, setAiResult] = useState<AIPreScreenOutput | null>(null)
  const [isScreening, setIsScreening] = useState(false)
  const qc = useQueryClient()
  const navigate = useNavigate()

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { source_type: 'outbound_search' },
  })

  const createMutation = useMutation({
    mutationFn: (data: FormData) => companiesApi.create({
      ...data,
      website: data.website || undefined,
    }),
    onSuccess: (company) => {
      qc.invalidateQueries({ queryKey: ['companies'] })
      void navigate({ to: '/sourcing/companies/$id', params: { id: company.id } })
    },
  })

  const onSubmit = (data: FormData) => createMutation.mutate(data)

  const handleAIScreen = async () => {
    const { name, website, description, sector, stage } = watch()
    if (!name) return
    setIsScreening(true)
    try {
      const result = await agentsApi.preScreen({ name, website: website || undefined, description, sector, stage })
      setAiResult(result)
    } finally {
      setIsScreening(false)
    }
  }

  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="Discover Companies" subtitle="Phase 01 — Add new deals to pipeline" />

      <div className="flex-1 p-6 max-w-2xl mx-auto w-full space-y-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Company Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Company Name *</label>
                <Input {...register('name')} placeholder="e.g. Razorpay" />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium">Website</label>
                <Input {...register('website')} placeholder="https://company.com" leftIcon={<Globe />} />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium">Description</label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                  placeholder="Brief description of what they do..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Sector</label>
                  <select {...register('sector')} className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <option value="">Select sector</option>
                    {SECTORS.map(s => <option key={s} value={s}>{s.replace('_', '')}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Stage</label>
                  <select {...register('stage')} className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <option value="">Select stage</option>
                    {STAGES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Geography</label>
                  <Input {...register('geography')} placeholder="IN, US, SG..." />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">City</label>
                  <Input {...register('city')} placeholder="Bangalore..." />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Source</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium">How was this company discovered? *</label>
                <select {...register('source_type')} className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  {SOURCES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Source detail</label>
                <Input {...register('source_detail')} placeholder="Scout name, conference, etc." />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1 gap-2"
              onClick={handleAIScreen}
              loading={isScreening}
            >
              <Sparkles className="size-4" />
              {isScreening ? 'Screening...' : 'AI Pre-Screen'}
            </Button>
            <Button
              type="submit"
              className="flex-1 gap-2"
              loading={createMutation.isPending}
            >
              <Plus className="size-4" />
              Add to Pipeline
            </Button>
          </div>
        </form>

        <AnimatePresence>
          {aiResult && <AIScoreCard result={aiResult} />}
        </AnimatePresence>
      </div>
    </div>
  )
}
