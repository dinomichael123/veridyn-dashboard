'use client'
import { useRealtimeTable } from '@/hooks/useRealtimeTable'
import type { ScheduledJob } from '@/lib/supabase/types'
import { Badge } from '@/components/ui/badge'

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return '—'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function ScheduledJobsPanel() {
  const { data: jobs, loading } = useRealtimeTable<ScheduledJob>('scheduled_jobs', { orderBy: 'updated_at' })

  if (loading) return <div className="panel animate-pulse h-32" />

  return (
    <div className="panel">
      <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
        Scheduled Jobs ({jobs.length})
      </h2>
      {jobs.length === 0 && <p className="text-zinc-500 text-sm">No scheduled jobs.</p>}
      <div className="space-y-2">
        {jobs.map(j => (
          <div key={j.id} className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg">
            <div className="min-w-0">
              <p className="text-sm text-zinc-200 truncate">{j.description}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{j.cron_expression}</p>
              {j.next_run_at && (
                <p className="text-xs text-zinc-500">Next: {timeAgo(j.next_run_at)}</p>
              )}
            </div>
            <Badge
              variant={j.enabled ? 'default' : 'secondary'}
              className="ml-3 shrink-0"
            >
              {j.enabled ? 'Active' : 'Paused'}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  )
}
