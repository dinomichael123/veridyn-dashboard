'use client'

import { useState, useEffect } from 'react'
import type { AdvisorOutput } from '@/app/api/revenue-advisor/route'

function timeAgo(iso: string) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

export function RevenueAdvisorPanel() {
  const [advice, setAdvice] = useState<AdvisorOutput | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAdvice() {
      try {
        const res = await fetch('/api/revenue-advisor')
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        setAdvice(json.advice ?? null)
      } catch (err) {
        setError(String(err))
      } finally {
        setIsLoading(false)
      }
    }
    fetchAdvice()
  }, [])

  async function handleGenerate() {
    if (isGenerating) return
    setIsGenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/revenue-advisor', { method: 'POST' })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error ?? `HTTP ${res.status}`)
      }
      const json = await res.json()
      setAdvice(json.advice)
    } catch (err) {
      setError(String(err))
    } finally {
      setIsGenerating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="panel mt-4">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-zinc-500 border-t-zinc-200 rounded-full animate-spin" />
          <span className="text-zinc-400 animate-pulse">Loading revenue advisor...</span>
        </div>
      </div>
    )
  }

  if (!advice) {
    return (
      <div className="panel mt-4">
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <span className="text-3xl">🧠</span>
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">AI Revenue Advisor</h2>
            <p className="text-zinc-400 text-sm mt-1">No advice generated yet.</p>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-100 text-sm rounded-lg transition-colors flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <span className="w-4 h-4 border-2 border-zinc-400 border-t-zinc-100 rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Advice'
            )}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="panel mt-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">
            AI Revenue Advisor{' '}
            <span className="text-zinc-500 text-sm font-normal">· Powered by Claude</span>
          </h2>
          <p className="text-zinc-500 text-xs mt-0.5">Generated {timeAgo(advice.generated_at)}</p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-100 text-sm rounded-lg transition-colors flex items-center gap-2 shrink-0"
        >
          {isGenerating ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-zinc-400 border-t-zinc-100 rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            'Generate New Advice'
          )}
        </button>
      </div>

      {error && (
        <p className="text-red-400 text-sm mb-4 p-2 bg-red-950/30 rounded-lg">{error}</p>
      )}

      <div className="space-y-5">
        {/* Section 1: Top Actions */}
        <div>
          <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide mb-2">
            Top 3 Actions This Week
          </h3>
          <ol className="space-y-2">
            {advice.top_actions.map((action, i) => (
              <li key={i} className="flex gap-2.5">
                <span className="text-green-400 font-bold text-sm shrink-0 mt-0.5">{i + 1}.</span>
                <span className="text-zinc-100 text-sm">{action}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Section 2: Underperforming */}
        <div>
          <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wide mb-1">
            Underperforming Asset
          </h3>
          <p className="text-zinc-200 text-sm">{advice.underperforming}</p>
        </div>

        {/* Section 3: Projected Impact */}
        <div>
          <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wide mb-1">
            Projected Impact
          </h3>
          <p className="text-zinc-200 text-sm">{advice.projected_impact}</p>
        </div>

        {/* Revenue Snapshot (collapsible) */}
        {advice.revenue_snapshot.length > 0 && (
          <details className="border border-zinc-800 rounded-lg">
            <summary className="px-3 py-2 text-xs text-zinc-500 cursor-pointer hover:text-zinc-300 transition-colors select-none">
              Revenue sources analyzed ({advice.revenue_snapshot.length})
            </summary>
            <ul className="px-3 pb-3 pt-1 space-y-1">
              {advice.revenue_snapshot.map((item) => (
                <li key={item.source} className="flex justify-between text-xs">
                  <span className="text-zinc-400">{item.source}</span>
                  <span className="text-zinc-300">${item.amount_usd.toFixed(2)}/mo</span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </div>
  )
}
