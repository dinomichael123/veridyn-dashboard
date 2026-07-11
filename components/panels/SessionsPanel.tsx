'use client'
import { useRealtimeTable } from '@/hooks/useRealtimeTable'
import type { Session } from '@/lib/supabase/types'
import { Badge } from '@/components/ui/badge'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function SessionsPanel() {
  const { data: sessions, loading } = useRealtimeTable<Session>('sessions')

  if (loading) return <div className="panel animate-pulse h-48" />

  return (
    <div className="panel">
      <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Sessions</h2>
      <div className="space-y-2">
        {sessions.length === 0 && <p className="text-zinc-500 text-sm">No sessions found.</p>}
        {sessions.map(s => (
          <div key={s.id} className="flex items-start justify-between p-3 bg-zinc-800 rounded-lg">
            <div className="min-w-0">
              <p className="text-sm font-medium text-zinc-100 truncate">{s.title}</p>
              <p className="text-xs text-zinc-500 truncate mt-0.5">{s.cwd}</p>
            </div>
            <div className="flex flex-col items-end gap-1 ml-3 shrink-0">
              <Badge
                variant={s.is_running ? 'default' : 'secondary'}
                className={s.is_running ? 'bg-green-700 text-green-100 text-xs' : 'text-xs'}
              >
                {s.is_running ? 'Running' : 'Idle'}
              </Badge>
              {s.last_activity_at && (
                <span className="text-xs text-zinc-500">
                  {timeAgo(s.last_activity_at)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
