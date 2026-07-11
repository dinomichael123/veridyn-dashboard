'use client'
import { useState, useEffect, useCallback } from 'react'
import type { SemrushData } from '@/lib/integrations/semrush'
import { parseSemrushCache } from '@/lib/integrations/semrush'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'

interface CacheRow {
  source: string
  amount_usd: number
  metadata: unknown
  updated_at: string
}

export function SeoTrafficPanel() {
  const [data, setData] = useState<SemrushData | null>(null)
  const [loading, setLoading] = useState(true)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/integrations/seo')
      if (res.ok) {
        const json = await res.json() as { data: CacheRow[] }
        const rows = json.data ?? []
        const parsed = parseSemrushCache(rows)
        setData(parsed)
        if (rows.length > 0) {
          setUpdatedAt(rows[0].updated_at)
        }
      }
    } catch {
      // network error — leave data null
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

  return (
    <div className="panel">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
            SEO &amp; Traffic · Semrush
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
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      )}

      {/* Empty state */}
      {!loading && !data && (
        <div className="py-6">
          <p className="text-zinc-300 text-sm mb-2">📊 No SEO data synced</p>
          <p className="text-zinc-500 text-xs mb-3">
            Run in a Claude Code session:
          </p>
          <pre className="text-left bg-zinc-800 rounded-lg p-3 text-xs text-zinc-400 overflow-x-auto whitespace-pre-wrap">
{`Use Semrush tools to fetch organic research for your domain
then POST the result to /api/integrations/seo`}
          </pre>
        </div>
      )}

      {/* Data present */}
      {!loading && data && (
        <div className="space-y-4">
          {/* 2x2 metric cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-zinc-800 rounded-lg p-3">
              <p className="text-xs text-zinc-500 mb-1">Organic Traffic</p>
              <p className="text-lg font-semibold text-zinc-100">
                {data.organic_traffic.toLocaleString()}
              </p>
              <p className="text-xs text-zinc-600">visits/mo</p>
            </div>
            <div className="bg-zinc-800 rounded-lg p-3">
              <p className="text-xs text-zinc-500 mb-1">Keywords Ranking</p>
              <p className="text-lg font-semibold text-zinc-100">
                {data.organic_keywords.toLocaleString()}
              </p>
              <p className="text-xs text-zinc-600">total keywords</p>
            </div>
            <div className="bg-zinc-800 rounded-lg p-3">
              <p className="text-xs text-zinc-500 mb-1">Backlinks</p>
              <p className="text-lg font-semibold text-zinc-100">
                {data.backlinks.toLocaleString()}
              </p>
            </div>
            <div className="bg-zinc-800 rounded-lg p-3">
              <p className="text-xs text-zinc-500 mb-1">Referring Domains</p>
              <p className="text-lg font-semibold text-zinc-100">
                {data.referring_domains.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Top Keywords table */}
          {data.top_keywords && data.top_keywords.length > 0 && (
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Top Keywords</p>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-zinc-600 border-b border-zinc-800">
                    <th className="text-left pb-1.5 font-normal">Keyword</th>
                    <th className="text-right pb-1.5 font-normal">Pos.</th>
                    <th className="text-right pb-1.5 font-normal">Vol./mo</th>
                  </tr>
                </thead>
                <tbody>
                  {data.top_keywords.slice(0, 5).map((kw, i) => (
                    <tr key={i} className="border-b border-zinc-800/50">
                      <td className="py-1.5 text-zinc-300 truncate max-w-0 w-full">{kw.keyword}</td>
                      <td className="py-1.5 text-right text-zinc-400">#{kw.position}</td>
                      <td className="py-1.5 text-right text-zinc-400">{kw.volume.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Traffic Trend sparkline */}
          {data.traffic_trend && data.traffic_trend.length > 0 && (
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Traffic Trend (6 mo)</p>
              <div className="flex items-end gap-1 h-[40px]">
                {(() => {
                  const max = Math.max(...data.traffic_trend)
                  return data.traffic_trend.map((v, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-violet-500 rounded-sm min-h-[2px]"
                      style={{ height: max > 0 ? `${(v / max) * 40}px` : '2px' }}
                    />
                  ))
                })()}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
