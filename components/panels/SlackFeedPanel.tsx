'use client'
import { useState, useEffect, useCallback } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'

interface SlackMetadata {
  summary: string
  bullets: string[]
  synced_at: string
}

interface CacheRow {
  source: string
  amount_usd: number
  metadata: unknown
  updated_at: string
}

export function SlackFeedPanel() {
  const [row, setRow] = useState<CacheRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setDismissed(false)
    try {
      const res = await fetch('/api/integrations/slack')
      if (res.ok) {
        const json = await res.json() as { data: CacheRow | null }
        setRow(json.data ?? null)
      }
    } catch {
      // network error — leave row null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  function timeAgo(iso: string | null) {
    if (!iso) return 'never'
    const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  const meta = row?.metadata as SlackMetadata | null

  return (
    <div className="panel">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
            Slack Feed
          </h2>
          {meta?.synced_at && !loading && (
            <p className="text-xs text-zinc-600 mt-0.5">Updated {timeAgo(meta.synced_at)}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!loading && meta && !dismissed && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDismissed(true)}
              className="text-zinc-500 hover:text-zinc-300"
            >
              Mark as read
            </Button>
          )}
          <Button size="sm" onClick={() => { void fetchData() }} disabled={loading}>
            {loading ? 'Loading…' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          <Skeleton className="h-4 w-3/4 rounded" />
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-5/6 rounded" />
          <Skeleton className="h-4 w-2/3 rounded" />
        </div>
      )}

      {/* Empty state */}
      {!loading && !row && (
        <div className="py-6">
          <p className="text-zinc-300 text-sm mb-2">💬 No Slack summary synced</p>
          <p className="text-zinc-500 text-xs">
            Connect Slack in Claude Code to sync channel summaries.
          </p>
        </div>
      )}

      {/* Data present and not dismissed */}
      {!loading && row && meta && !dismissed && (
        <div className="space-y-3">
          <p className="text-sm text-zinc-300 leading-relaxed">{meta.summary}</p>
          {meta.bullets && meta.bullets.length > 0 && (
            <ul className="space-y-1.5">
              {meta.bullets.map((bullet, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-zinc-400">
                  <span className="text-zinc-600 shrink-0 mt-0.5">•</span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Dismissed state */}
      {!loading && row && dismissed && (
        <div className="py-4 text-center">
          <p className="text-xs text-zinc-600">Marked as read. Refresh to see again.</p>
        </div>
      )}
    </div>
  )
}
