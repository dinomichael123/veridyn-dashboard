'use client'
import { useState, useEffect, useCallback } from 'react'
import { parseYouTubeCache, type YouTubeChannelData } from '@/lib/integrations/nexlev'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'

interface CacheRow {
  source: string
  amount_usd: number
  metadata: unknown
  updated_at: string
}

function fmtSubs(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

function fmtUSD(n: number) {
  return '$' + Math.round(n).toLocaleString('en-US')
}

function OutlierBadge({ score }: { score: number }) {
  if (score >= 3) {
    return (
      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-500/20 text-green-400">
        Exceptional
      </span>
    )
  }
  if (score >= 2) {
    return (
      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-amber-500/20 text-amber-400">
        Strong
      </span>
    )
  }
  if (score >= 1) {
    return (
      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-500/20 text-blue-400">
        Above Avg
      </span>
    )
  }
  return null
}

export function YouTubeDeepDivePanel() {
  const [channels, setChannels] = useState<YouTubeChannelData[]>([])
  const [loading, setLoading] = useState(true)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/integrations/youtube')
      if (res.ok) {
        const json = await res.json() as { data: CacheRow[] }
        const rows = json.data ?? []
        const parsed = parseYouTubeCache(rows)
        setChannels(parsed)
        if (rows.length > 0) {
          setUpdatedAt(rows[0].updated_at)
        }
      }
    } catch {
      // network error — leave empty
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
            YouTube Deep Dive
          </h2>
          {updatedAt && !loading && (
            <p className="text-xs text-zinc-600 mt-0.5">Synced via NexLev</p>
          )}
        </div>
        <Button size="sm" onClick={() => { void fetchData() }} disabled={loading}>
          {loading ? 'Loading…' : 'Refresh'}
        </Button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="space-y-3">
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      )}

      {/* Empty state */}
      {!loading && channels.length === 0 && (
        <div className="py-6">
          <p className="text-zinc-300 text-sm mb-2">📺 YouTube Deep Dive</p>
          <p className="text-zinc-500 text-xs">
            No channel data synced. Sync via Claude Code using NexLev tools.
          </p>
        </div>
      )}

      {/* Data present */}
      {!loading && channels.length > 0 && (
        <div className="space-y-4">
          {channels.map(ch => (
            <div key={ch.channel_id} className="bg-zinc-800 rounded-lg p-4">
              {/* Channel header */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <p className="font-semibold text-zinc-100">{ch.channel_name}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{fmtSubs(ch.subscribers)} subs</p>
                </div>
                {ch.outlier_score != null && ch.outlier_score >= 1 && (
                  <OutlierBadge score={ch.outlier_score} />
                )}
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-zinc-700/50 rounded-lg p-2.5">
                  <p className="text-xs text-zinc-500 mb-0.5">Est. Monthly Revenue</p>
                  <p className="text-sm font-semibold text-green-400">
                    {fmtUSD(ch.estimated_monthly_revenue)}/mo
                  </p>
                </div>
                <div className="bg-zinc-700/50 rounded-lg p-2.5">
                  <p className="text-xs text-zinc-500 mb-0.5">RPM</p>
                  <p className="text-sm font-semibold text-zinc-200">
                    ${ch.rpm_usd.toFixed(2)} RPM
                  </p>
                </div>
              </div>

              {/* Recent videos */}
              {ch.recent_videos && ch.recent_videos.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-zinc-600 uppercase tracking-wider mb-1.5">
                    Recent Videos
                  </p>
                  <div className="space-y-1">
                    {ch.recent_videos.slice(0, 3).map(v => (
                      <div key={v.id} className="flex items-center justify-between gap-2 text-xs">
                        <span className="text-zinc-300 truncate">
                          {v.title.length > 50 ? v.title.slice(0, 50) + '…' : v.title}
                        </span>
                        <span className="text-zinc-500 whitespace-nowrap shrink-0">
                          {v.views.toLocaleString()} views
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA */}
              <a
                href="/voice"
                className="inline-flex items-center justify-center rounded-lg border border-zinc-600 bg-transparent px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors"
              >
                Ask Claude about next video
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
