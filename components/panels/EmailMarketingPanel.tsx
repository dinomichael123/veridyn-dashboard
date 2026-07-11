'use client'
import { useState, useEffect, useCallback } from 'react'
import type { KlaviyoData } from '@/lib/integrations/klaviyo'
import { parseKlaviyoCache } from '@/lib/integrations/klaviyo'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'

interface CacheRow {
  source: string
  amount_usd: number
  metadata: unknown
  updated_at: string
}

export function EmailMarketingPanel() {
  const [data, setData] = useState<KlaviyoData | null>(null)
  const [loading, setLoading] = useState(true)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/integrations/email')
      if (res.ok) {
        const json = await res.json() as { data: CacheRow[] }
        const rows = json.data ?? []
        const parsed = parseKlaviyoCache(rows)
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

  function fmtDate(iso: string) {
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="panel">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
            Email &amp; Marketing · Klaviyo
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
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </div>
      )}

      {/* Empty state */}
      {!loading && !data && (
        <div className="py-6">
          <p className="text-zinc-300 text-sm mb-2">📧 No email data synced</p>
          <p className="text-zinc-500 text-xs">
            Klaviyo data can be synced via Claude Code with the Klaviyo MCP.
          </p>
        </div>
      )}

      {/* Data present */}
      {!loading && data && (
        <div className="space-y-4">
          {/* Stats row */}
          <div className="flex gap-4">
            <div className="bg-zinc-800 rounded-lg p-3 flex-1 text-center">
              <p className="text-xs text-zinc-500 mb-1">List Size</p>
              <p className="text-lg font-semibold text-zinc-100">
                {data.list_size.toLocaleString()}
              </p>
            </div>
            <div className="bg-zinc-800 rounded-lg p-3 flex-1 text-center">
              <p className="text-xs text-zinc-500 mb-1">Open Rate</p>
              <p className="text-lg font-semibold text-zinc-100">
                {data.open_rate.toFixed(1)}%
              </p>
            </div>
            <div className="bg-zinc-800 rounded-lg p-3 flex-1 text-center">
              <p className="text-xs text-zinc-500 mb-1">Click Rate</p>
              <p className="text-lg font-semibold text-zinc-100">
                {data.click_rate.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Attributed revenue MTD */}
          <div className="bg-zinc-800 rounded-lg p-3 flex items-center justify-between">
            <p className="text-sm text-zinc-400">Attributed revenue MTD</p>
            <p className="text-lg font-semibold text-green-400">
              ${data.attributed_revenue_mtd.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </p>
          </div>

          {/* Campaigns table */}
          {data.campaigns && data.campaigns.length > 0 && (
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Recent Campaigns</p>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-zinc-600 border-b border-zinc-800">
                    <th className="text-left pb-1.5 font-normal">Campaign</th>
                    <th className="text-right pb-1.5 font-normal">Sent</th>
                    <th className="text-right pb-1.5 font-normal">Open%</th>
                    <th className="text-right pb-1.5 font-normal">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {data.campaigns.slice(0, 5).map((c, i) => (
                    <tr key={i} className="border-b border-zinc-800/50">
                      <td className="py-1.5 text-zinc-300 truncate max-w-0 w-full">{c.name}</td>
                      <td className="py-1.5 text-right text-zinc-500 whitespace-nowrap">{fmtDate(c.sent_at)}</td>
                      <td className="py-1.5 text-right text-zinc-400">{c.open_rate.toFixed(1)}%</td>
                      <td className="py-1.5 text-right text-green-400">${c.revenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
