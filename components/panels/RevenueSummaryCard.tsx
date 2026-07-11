'use client'
import { useRealtimeTable } from '@/hooks/useRealtimeTable'
import type { RevenueCache } from '@/lib/supabase/types'
import { Skeleton } from '@/components/ui/skeleton'

const EXCLUDE_SOURCES = ['semrush_organic', 'slack_summary']

function fmtSource(source: string) {
  if (source.startsWith('youtube_')) return 'YouTube'
  if (source === 'veridyn') return 'Veridyn SaaS'
  if (source === 'klaviyo') return 'Klaviyo Email'
  if (source === 'affiliate') return 'Affiliate'
  if (source === 'ecommerce') return 'E-commerce'
  return source.charAt(0).toUpperCase() + source.slice(1)
}

function fmtUSD(n: number) {
  return '$' + Math.round(n).toLocaleString('en-US')
}

function timeAgo(iso: string | null) {
  if (!iso) return 'never'
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

export function RevenueSummaryCard() {
  const { data, loading } = useRealtimeTable<RevenueCache>('revenue_cache')

  const now = new Date()
  const currentPeriod = now.toISOString().slice(0, 7) // YYYY-MM
  const dayOfMonth = now.getDate()
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()

  const revenueRows = data.filter(r => !EXCLUDE_SOURCES.includes(r.source))

  // Include rows matching current period or with null period
  const currentRows = revenueRows.filter(r => r.period === currentPeriod || r.period === null)

  const totalThisMonth = currentRows.reduce((sum, r) => sum + r.amount_usd, 0)
  const projectedEOM = dayOfMonth > 0 ? (totalThisMonth / dayOfMonth) * daysInMonth : 0

  const topSourceRow = revenueRows.reduce<RevenueCache | null>((top, r) => {
    if (!top || r.amount_usd > top.amount_usd) return r
    return top
  }, null)

  const sourceCount = new Set(revenueRows.map(r => r.source)).size

  const lastUpdated = data.length > 0
    ? data.reduce((latest, r) => r.updated_at > latest ? r.updated_at : latest, data[0].updated_at)
    : null

  if (loading) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="bg-zinc-800 rounded-lg p-4">
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-base font-semibold text-white">Revenue Overview</h2>
        {lastUpdated && (
          <span className="text-xs text-zinc-500">Last updated: {timeAgo(lastUpdated)}</span>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-zinc-800 rounded-lg p-4">
          <p className="text-zinc-400 text-sm mb-1">Total This Month</p>
          <p className="text-2xl font-bold text-white">{fmtUSD(totalThisMonth)}</p>
        </div>
        <div className="bg-zinc-800 rounded-lg p-4">
          <p className="text-zinc-400 text-sm mb-1">Projected EOMonth</p>
          <p className="text-2xl font-bold text-white">{fmtUSD(projectedEOM)}</p>
        </div>
        <div className="bg-zinc-800 rounded-lg p-4">
          <p className="text-zinc-400 text-sm mb-1">Top Source</p>
          <p className="text-2xl font-bold text-white">
            {topSourceRow ? fmtSource(topSourceRow.source) : '—'}
          </p>
        </div>
        <div className="bg-zinc-800 rounded-lg p-4">
          <p className="text-zinc-400 text-sm mb-1">Sources</p>
          <p className="text-2xl font-bold text-white">{sourceCount} active</p>
        </div>
      </div>
    </div>
  )
}
