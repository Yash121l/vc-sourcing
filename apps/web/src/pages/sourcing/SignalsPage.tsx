import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Zap, CheckCheck } from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { signalsApi } from '@/lib/api'
import { SIGNAL_CONFIG, formatRelativeTime } from '@/lib/utils'
import type { Signal } from '@vc/types'

function SignalRow({ signal, onRead }: { signal: Signal; onRead: () => void }) {
  const cfg = SIGNAL_CONFIG[signal.type]
  const TypeIcon = cfg.icon
  return (
    <div
      className={`flex items-start gap-4 p-4 border-b border-border transition-colors ${!signal.is_read ? 'bg-blue-500/5' : ''}`}
      onClick={!signal.is_read ? onRead : undefined}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
        style={{ background: `${cfg.color}15` }}>
        <TypeIcon className="size-4" style={{ color: cfg.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className={`text-sm ${!signal.is_read ? 'font-semibold' : 'font-medium'} leading-snug`}>
              {signal.title}
            </p>
            {signal.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{signal.description}</p>
            )}
            <div className="flex items-center gap-2 mt-1.5">
              <Badge variant={signal.sentiment === 'positive' ? 'success' : signal.sentiment === 'negative' ? 'destructive' : 'secondary'}
                className="text-[10px] px-1.5 py-0">
                {signal.sentiment}
              </Badge>
              <span className="text-[10px] text-muted-foreground"
                style={{ background: `${cfg.color}15`, color: cfg.color, padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
                {cfg.label}
              </span>
              {signal.source_name && (
                <span className="text-[10px] text-muted-foreground">{signal.source_name}</span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            {!signal.is_read && <div className="h-2 w-2 rounded-full bg-blue-500 signal-live" />}
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
              {formatRelativeTime(signal.detected_at)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function SignalsPage() {
  const qc = useQueryClient()
  const { data: signals = [], isLoading } = useQuery({
    queryKey: ['signals'],
    queryFn: signalsApi.list,
    refetchInterval: 30_000,
  })

  const markRead = useMutation({
    mutationFn: (id: string) => signalsApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['signals'] }),
  })

  const unread = signals.filter(s => !s.is_read)
  const byType = Object.entries(
    signals.reduce((acc, s) => { acc[s.type] = (acc[s.type] ?? 0) + 1; return acc }, {} as Record<string, number>)
  )

  return (
    <div className="flex flex-col min-h-full">
      <TopBar
        title="Signal Feed"
        subtitle={`${unread.length} unread signals`}
        actions={
          unread.length > 0 ? (
            <Button variant="outline" size="sm" className="gap-1.5"
              onClick={() => unread.forEach(s => markRead.mutate(s.id))}>
              <CheckCheck className="size-3.5" /> Mark all read
            </Button>
          ) : undefined
        }
      />

      <div className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-4">
        {/* Signal type summary */}
        <div className="flex flex-wrap gap-2">
          {byType.map(([type, count]) => {
            const cfg = SIGNAL_CONFIG[type as keyof typeof SIGNAL_CONFIG]
            if (!cfg) return null
            const TypeIcon = cfg.icon
            return (
              <span key={type} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
                style={{ background: `${cfg.color}15`, color: cfg.color }}>
                <TypeIcon className="size-3.5" /> {cfg.label}
                <span className="font-bold">{count}</span>
              </span>
            )
          })}
        </div>

        {/* Signals list */}
        <Card className="overflow-hidden">
          {isLoading ? (
            <div className="divide-y divide-border">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="flex gap-4 p-4">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : signals.length === 0 ? (
            <div className="py-16 text-center">
              <Zap className="size-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No signals yet</p>
              <p className="text-xs text-muted-foreground mt-1">Signals appear as portfolio companies generate news</p>
            </div>
          ) : (
            <div>
              {signals.map(signal => (
                <SignalRow
                  key={signal.id}
                  signal={signal}
                  onRead={() => markRead.mutate(signal.id)}
                />
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
