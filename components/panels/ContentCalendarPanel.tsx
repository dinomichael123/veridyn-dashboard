'use client'
import { useState, useEffect, useCallback } from 'react'
import type { YouTubeChannelData } from '@/lib/integrations/nexlev'
import { parseYouTubeCache } from '@/lib/integrations/nexlev'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'

function timeAgo(iso: string | null) {
  if (!iso) return 'never'
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

function fmtRevenue(n: number) {
  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

interface CacheRow {
  source: string
  amount_usd: number
  metadata: unknown
  updated_at: string
}

export function ContentCalendarPanel() {
  const [channels, setChannels] = useState<YouTubeChannelData[]>([])
  const [loading, setLoading] = useState(true)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/integrations/youtube')
      if (res.ok) {
        const json = await res.json() as { data: CacheRow[] }
        const parsed = parseYouTubeCache(json.data ?? [])
        setChannels(parsed)
        if (json.data && json.data.length > 0) {
          setUpdatedAt(json.data[0].updated_at)
        }
      }
    } catch {
      // network error — leave channels empty
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  return (
    <div className="panel">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
            YouTube / Content Calendar
          </h2>
          {updatedAt && !loading && (
            <p className="text-xs text-zinc-600 mt-0.5">Synced {timeAgo(updatedAt)}</p>
          )}
        </div>
        <Button size="sm" onClick={() => { void fetchData() }} disabled={loading}>
          {loading ? 'Loading…' : 'Refresh'}
        </Button>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      )}

      {/* Empty state */}
      {!loading && channels.length === 0 && (
        <div className="text-center py-6">
          <p className="text-zinc-300 text-sm mb-2">📺 No YouTube data synced yet</p>
          <p className="text-zinc-500 text-xs mb-3">
            Run this in a Claude Code session to sync:
          </p>
          <pre className="text-left bg-zinc-800 rounded-lg p-3 text-xs text-zinc-300 overflow-x-auto whitespace-pre-wrap">
{`// Use NexLev tools to get channel analytics, then POST to API:
// 1. Call NexLev get_channel_analytics to fetch your channel data
// 2. POST to /api/integrations/youtube with:
// {
//   "channels": [
//     {
//       "channel_id": "YOUR_CHANNEL_ID",
//       "channel_name": "Your Channel",
//       "subscribers": 10000,
//       "total_views": 500000,
//       "video_count": 50,
//       "rpm_usd": 5.50,
//       "estimated_monthly_revenue": 275,
//       "recent_videos": []
//     }
//   ]
// }`}
          </pre>
        </div>
      )}

      {/* Channel cards */}
      {!loading && channels.map(channel => (
        <div key={channel.channel_id} className="bg-zinc-800 rounded-lg p-3 mb-3">
          {/* Channel header */}
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="font-semibold text-sm text-zinc-100">{channel.channel_name}</p>
              <p className="text-xs text-zinc-400 mt-0.5">
                {channel.subscribers.toLocaleString()} subscribers
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-green-400">
                {fmtRevenue(channel.estimated_monthly_revenue)}/mo
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">
                RPM: ${channel.rpm_usd.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex gap-4 mb-3 text-xs text-zinc-500">
            <span>{channel.total_views.toLocaleString()} total views</span>
            <span>{channel.video_count} videos</span>
            {channel.outlier_score !== undefined && channel.outlier_score >= 2 && (
              <span className="bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">
                Outlier {channel.outlier_score.toFixed(1)}
              </span>
            )}
          </div>

          {/* Recent videos */}
          {channel.recent_videos && channel.recent_videos.length > 0 && (
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1.5">Recent Videos</p>
              <ul className="space-y-1.5">
                {channel.recent_videos.slice(0, 5).map(video => (
                  <li key={video.id} className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-zinc-300 truncate">{video.title}</p>
                      <p className="text-xs text-zinc-600">
                        {video.views.toLocaleString()} views
                      </p>
                    </div>
                    {video.outlier_score !== undefined && video.outlier_score >= 2 && (
                      <span className="bg-amber-500/20 text-amber-400 text-xs px-1.5 py-0.5 rounded shrink-0">
                        {video.outlier_score.toFixed(1)}x
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
