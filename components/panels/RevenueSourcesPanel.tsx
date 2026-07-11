'use client'
import { useState, type FormEvent } from 'react'
import { useRealtimeTable } from '@/hooks/useRealtimeTable'
import type { RevenueCache } from '@/lib/supabase/types'
import { createClient } from '@/lib/supabase/client'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

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

const defaultPeriod = () => new Date().toISOString().slice(0, 7)

export function RevenueSourcesPanel() {
  const { data, loading } = useRealtimeTable<RevenueCache>('revenue_cache')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [sourceName, setSourceName] = useState('')
  const [amountUSD, setAmountUSD] = useState('')
  const [period, setPeriod] = useState(defaultPeriod)
  const [notes, setNotes] = useState('')

  const revenueRows = data
    .filter(r => !EXCLUDE_SOURCES.includes(r.source))
    .sort((a, b) => b.amount_usd - a.amount_usd)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!sourceName.trim() || !amountUSD) return
    setSubmitting(true)
    try {
      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('revenue_cache') as any).upsert({
        id: sourceName.trim(),
        source: sourceName.trim(),
        amount_usd: parseFloat(amountUSD),
        period: period || null,
        metadata: notes.trim() ? { notes: notes.trim() } : null,
      })
      setDialogOpen(false)
      setSourceName('')
      setAmountUSD('')
      setPeriod(defaultPeriod())
      setNotes('')
    } catch {
      // network / supabase error — leave dialog open
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="panel">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
          Revenue Sources
        </h2>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-2">
          {[0, 1, 2, 3].map(i => (
            <Skeleton key={i} className="h-10 w-full rounded-lg" />
          ))}
        </div>
      )}

      {/* Data / empty */}
      {!loading && (
        <>
          {revenueRows.length === 0 ? (
            <p className="text-zinc-500 text-sm py-4">No revenue sources found.</p>
          ) : (
            <div className="space-y-0.5">
              {/* Header row */}
              <div className="grid grid-cols-3 text-xs text-zinc-600 uppercase tracking-wider pb-1.5 border-b border-zinc-800 px-2">
                <span>Source</span>
                <span className="text-right">This Month</span>
                <span className="text-right">Trend</span>
              </div>

              {revenueRows.map(row => (
                <div key={row.id}>
                  <button
                    type="button"
                    onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}
                    className="w-full grid grid-cols-3 py-2.5 text-sm hover:bg-zinc-800/50 rounded-lg px-2 transition-colors text-left"
                  >
                    <span className="text-zinc-200 font-medium">{fmtSource(row.source)}</span>
                    <span className="text-right text-green-400">{fmtUSD(row.amount_usd)}</span>
                    <span className="text-right text-zinc-400">→</span>
                  </button>

                  {expandedId === row.id && row.metadata != null && (
                    <div className="mx-2 mb-2 bg-zinc-800 rounded-lg p-3">
                      <pre className="text-xs text-zinc-400 overflow-x-auto whitespace-pre-wrap break-all">
                        {JSON.stringify(row.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add manual entry */}
          <div className="mt-4 pt-4 border-t border-zinc-800">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setDialogOpen(true)}
            >
              + Add Manual Entry
            </Button>
          </div>
        </>
      )}

      {/* Add manual entry dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Manual Revenue Entry</DialogTitle>
          </DialogHeader>
          <form id="add-revenue-form" onSubmit={handleSubmit} className="space-y-3 text-sm mt-1">
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Source Name</label>
              <input
                required
                value={sourceName}
                onChange={e => setSourceName(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-400"
                placeholder="e.g. affiliate, ecommerce, consulting"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Amount (USD)</label>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={amountUSD}
                onChange={e => setAmountUSD(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-400"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Period (YYYY-MM)</label>
              <input
                type="month"
                value={period}
                onChange={e => setPeriod(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-1.5 text-sm text-zinc-100 focus:outline-none focus:border-zinc-400"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Notes (optional)</label>
              <textarea
                rows={3}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-400 resize-none"
                placeholder="Optional notes…"
              />
            </div>
          </form>
          <DialogFooter>
            <Button
              type="submit"
              form="add-revenue-form"
              disabled={submitting}
            >
              {submitting ? 'Saving…' : 'Save Entry'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
