import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'
import { Sparkles, CheckCircle, Eye, XCircle, Loader2, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { screeningsApi, agentsApi } from '@/lib/api'
import { SCORECARD_DIMENSIONS, scoreColor, computeOverallScore, SECTOR_CONFIG, STAGE_CONFIG } from '@/lib/utils'
import type { ScorecardDimensions } from '@vc/types'

function ScoreDial({ label, score, description, rationale }: {
  label: string; score: number | undefined | null; description: string; rationale?: string
}) {
  const color = score != null ? scoreColor(score) : '#64748b'
  return (
    <div className="p-3 rounded-xl border border-border bg-card/50 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold">{label}</p>
          <p className="text-[10px] text-muted-foreground">{description}</p>
        </div>
        <span className="font-display text-xl font-light shrink-0" style={{ color }}>
          {score != null ? score.toFixed(1) : '—'}
        </span>
      </div>
      {score != null && (
        <div className="h-1 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${score * 10}%`, background: color }} />
        </div>
      )}
      {rationale && (
        <p className="text-[10px] text-muted-foreground leading-relaxed">{rationale}</p>
      )}
    </div>
  )
}

export function ScreeningDetailPage() {
  const { id } = useParams({ from: '/screening/$id' })
  const qc = useQueryClient()
  const [memoText, setMemoText] = useState('')
  const [isGeneratingMemo, setIsGeneratingMemo] = useState(false)
  const [decisionRationale, setDecisionRationale] = useState('')

  const { data: screening, isLoading } = useQuery({
    queryKey: ['screening', id],
    queryFn: () => screeningsApi.get(id),
  })

  const aiScoreMutation = useMutation({
    mutationFn: () => agentsApi.score(
      screening!.company_id,
      id,
      screening?.meeting_notes ?? undefined
    ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['screening', id] }),
  })

  const decideMutation = useMutation({
    mutationFn: (decision: 'pass' | 'proceed' | 'watch') =>
      screeningsApi.decide(id, decision, decisionRationale),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['screening', id] }),
  })

  const updateNotesMutation = useMutation({
    mutationFn: (notes: string) => screeningsApi.update(id, { meeting_notes: notes }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['screening', id] }),
  })

  const handleGenerateMemo = async () => {
    if (!screening) return
    setIsGeneratingMemo(true)
    setMemoText('')
    await agentsApi.streamICMemo(screening.company_id, id, (chunk) => {
      setMemoText(prev => prev + chunk)
    })
    setIsGeneratingMemo(false)
    qc.invalidateQueries({ queryKey: ['screening', id] })
  }

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-full">
        <TopBar title="Screening" />
        <div className="p-6 space-y-4 max-w-5xl mx-auto w-full">
          <Skeleton className="h-24 w-full" />
          <div className="grid grid-cols-3 gap-4">
            {[1,2,3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
          </div>
        </div>
      </div>
    )
  }

  if (!screening) return <div>Screening not found</div>

  const scores: Partial<ScorecardDimensions> = {
    team: screening.score_team ?? undefined,
    market: screening.score_market ?? undefined,
    product: screening.score_product ?? undefined,
    traction: screening.score_traction ?? undefined,
    business_model: screening.score_business_model ?? undefined,
    investment_fit: screening.score_investment_fit ?? undefined,
  }
  const hasScores = Object.values(scores).some(v => v != null)
  const overall = screening.overall_score ?? computeOverallScore(scores)
  const overallColor = scoreColor(overall)
  const aiRationale = screening.ai_score_rationale as Record<string, string> | undefined
  const aiFlags = screening.ai_flags as Array<{ severity: string; description: string }> | undefined

  const radarData = SCORECARD_DIMENSIONS.map(dim => ({
    dimension: dim.label.split(' ')[0] ?? dim.label,
    score: scores[dim.key] ?? 0,
    fullMark: 10,
  }))

  const company = screening.company

  return (
    <div className="flex flex-col min-h-full">
      <TopBar
        title={company?.name ?? 'Screening'}
        subtitle="Initial Screening — Phase 02"
        actions={
          <div className="flex items-center gap-2">
            <Badge variant={
              screening.status === 'completed' ? 'success' :
              screening.status === 'in_progress' ? 'info' : 'secondary'
            } className="gap-1">
              {screening.status.replace('_', ' ')}
            </Badge>
          </div>
        }
      />

      <div className="flex-1 p-6 max-w-5xl mx-auto w-full space-y-6">
        {/* Company header */}
        {company && (
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 shrink-0 rounded-xl bg-indigo-500/15 flex items-center justify-center text-lg font-bold uppercase text-indigo-400">
                  {company.name.slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold">{company.name}</h2>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <Badge variant="outline">{SECTOR_CONFIG[company.sector]?.label}</Badge>
                    <Badge variant="outline">{STAGE_CONFIG[company.stage]?.label}</Badge>
                    {company.city && <span className="text-xs text-muted-foreground">{company.city}</span>}
                  </div>
                  {company.description && (
                    <p className="mt-2 text-sm text-muted-foreground">{company.description}</p>
                  )}
                </div>
                {hasScores && (
                  <div className="text-center shrink-0">
                    <span className="font-display text-4xl font-light" style={{ color: overallColor }}>
                      {overall.toFixed(1)}
                    </span>
                    <p className="text-xs text-muted-foreground">Overall</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="scorecard">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="scorecard">Scorecard</TabsTrigger>
            <TabsTrigger value="notes">Meeting Notes</TabsTrigger>
            <TabsTrigger value="memo">IC Memo</TabsTrigger>
            <TabsTrigger value="decision">Decision</TabsTrigger>
          </TabsList>

          {/* SCORECARD TAB */}
          <TabsContent value="scorecard" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">6-Dimension Scorecard</h3>
              <Button
                variant="outline" size="sm" className="gap-1.5"
                onClick={() => aiScoreMutation.mutate()}
                loading={aiScoreMutation.isPending}
              >
                <Sparkles className="size-3.5" />
                {hasScores ? 'Re-score with AI' : 'Score with AI'}
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SCORECARD_DIMENSIONS.map(dim => (
                  <ScoreDial
                    key={dim.key}
                    label={dim.label}
                    description={dim.description}
                    score={scores[dim.key]}
                    rationale={aiRationale?.[dim.key]}
                  />
                ))}
              </div>

              {hasScores && (
                <div className="flex flex-col gap-4">
                  <Card>
                    <CardContent className="pt-5">
                      <ResponsiveContainer width="100%" height={220}>
                        <RadarChart data={radarData}>
                          <PolarGrid stroke="var(--border)" />
                          <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                          <Radar dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {aiFlags && aiFlags.length > 0 && (
                    <Card className="border-amber-500/25">
                      <CardHeader>
                        <CardTitle className="text-sm text-amber-500">⚠ Red Flags ({aiFlags.length})</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {aiFlags.map((flag, i) => (
                          <div key={i} className={`flex items-start gap-2 text-xs p-2 rounded-lg ${
                            flag.severity === 'critical' ? 'bg-red-500/10 text-red-400' :
                            flag.severity === 'high' ? 'bg-amber-500/10 text-amber-400' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            <span className="font-bold uppercase text-[10px] shrink-0 mt-0.5">{flag.severity}</span>
                            <span>{flag.description}</span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {screening.ai_summary && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Sparkles className="size-3.5 text-indigo-400" /> AI Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground leading-relaxed">{screening.ai_summary}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          {/* NOTES TAB */}
          <TabsContent value="notes">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Founder Intro Call Notes</CardTitle>
                <p className="text-xs text-muted-foreground">30-min call — founder-market fit, vision, coachability, team dynamics</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <textarea
                  className="w-full min-h-[300px] rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-mono resize-none"
                  placeholder="Notes from founder intro call...

## Team Assessment
- Founder background:
- Founder-market fit:
- Coachability signals:

## Market Sizing
- Their TAM claim:
- Your validation:

## Competitive Landscape
- Direct competitors:
- Moat / differentiation:

## Business Model
- Revenue model:
- Unit economics:
- Payback period:"
                  defaultValue={screening.meeting_notes ?? ''}
                  onBlur={(e) => updateNotesMutation.mutate(e.target.value)}
                />
                <p className="text-[10px] text-muted-foreground">Auto-saved on blur</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* IC MEMO TAB */}
          <TabsContent value="memo">
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm">IC Screening Memo</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">AI-generated draft for investment committee</p>
                </div>
                <Button
                  variant="outline" size="sm" className="gap-1.5 shrink-0"
                  onClick={handleGenerateMemo}
                  loading={isGeneratingMemo}
                >
                  <Sparkles className="size-3.5" />
                  {screening.ic_memo_draft ? 'Regenerate' : 'Generate Memo'}
                </Button>
              </CardHeader>
              <CardContent>
                {isGeneratingMemo || memoText ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <pre className={`whitespace-pre-wrap text-sm font-sans leading-relaxed ${isGeneratingMemo ? 'streaming' : ''}`}>
                      {memoText || screening.ic_memo_draft}
                    </pre>
                  </div>
                ) : screening.ic_memo_draft ? (
                  <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed">{screening.ic_memo_draft}</pre>
                ) : (
                  <div className="py-12 text-center text-muted-foreground">
                    <Sparkles className="size-8 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">Click "Generate Memo" to create an AI-drafted IC screening memo</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* DECISION TAB */}
          <TabsContent value="decision">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Screening Decision</CardTitle>
                <p className="text-xs text-muted-foreground">After team vote — submit final pass/proceed/watch</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {screening.decision ? (
                  <div className="flex items-center gap-3 p-4 rounded-xl border-2"
                    style={{
                      borderColor: screening.decision === 'proceed' ? '#10b98140' : screening.decision === 'watch' ? '#f59e0b40' : '#ef444440',
                      background: screening.decision === 'proceed' ? '#10b98108' : screening.decision === 'watch' ? '#f59e0b08' : '#ef444408',
                    }}>
                    <CheckCircle className="size-5" style={{ color: screening.decision === 'proceed' ? '#10b981' : screening.decision === 'watch' ? '#f59e0b' : '#ef4444' }} />
                    <div>
                      <p className="font-semibold capitalize">{screening.decision === 'proceed' ? 'Proceed to DD' : screening.decision}</p>
                      {screening.decision_rationale && (
                        <p className="text-sm text-muted-foreground mt-0.5">{screening.decision_rationale}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Decision Rationale (required)</label>
                      <textarea
                        rows={4}
                        value={decisionRationale}
                        onChange={e => setDecisionRationale(e.target.value)}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                        placeholder="Provide rationale for the decision..."
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <Button
                        variant="destructive"
                        className="gap-2"
                        disabled={!decisionRationale || decideMutation.isPending}
                        onClick={() => decideMutation.mutate('pass')}
                      >
                        <XCircle className="size-4" /> Pass
                      </Button>
                      <Button
                        variant="warning"
                        className="gap-2"
                        disabled={!decisionRationale || decideMutation.isPending}
                        onClick={() => decideMutation.mutate('watch')}
                      >
                        <Eye className="size-4" /> Watch
                      </Button>
                      <Button
                        variant="success"
                        className="gap-2"
                        disabled={!decisionRationale || decideMutation.isPending}
                        onClick={() => decideMutation.mutate('proceed')}
                      >
                        <ChevronRight className="size-4" /> Proceed to DD
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
