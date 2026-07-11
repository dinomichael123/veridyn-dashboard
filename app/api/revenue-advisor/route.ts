import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAnthropicClient } from '@/lib/anthropic'
import type { Json } from '@/lib/supabase/types'

export interface AdvisorOutput {
  top_actions: string[]
  underperforming: string
  projected_impact: string
  generated_at: string
  revenue_snapshot: { source: string; amount_usd: number }[]
}

interface RevenueCacheRow {
  id: string
  source: string
  amount_usd: number
  period: string | null
  metadata: Json | null
  updated_at: string
}

// Sources to exclude from revenue analysis
const EXCLUDED_SOURCES = ['semrush_organic', 'slack_summary', 'ai_advisor']

export async function GET() {
  try {
    const supabase = createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('revenue_cache') as any)
      .select('*')
      .eq('source', 'ai_advisor')
      .order('updated_at', { ascending: false })
      .limit(1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const row = (data as RevenueCacheRow[])?.[0]
    const advice = (row?.metadata ?? null) as AdvisorOutput | null

    return NextResponse.json({ advice: advice ?? null })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST() {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 503 })
  }

  try {
    const supabase = createClient()

    // 1. Fetch all revenue_cache rows
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rawRows, error } = await (supabase.from('revenue_cache') as any).select('*')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const allRows = (rawRows as RevenueCacheRow[]) ?? []

    // 2. Filter to revenue-relevant sources
    const revenueRows = allRows.filter(
      (row) => !EXCLUDED_SOURCES.includes(row.source) && row.amount_usd > 0
    )

    const total = revenueRows.reduce((sum, row) => sum + row.amount_usd, 0)

    const revenueLines = revenueRows
      .map((row) => `- ${row.source}: $${row.amount_usd.toFixed(2)}/month`)
      .join('\n')

    // 3. Build system prompt
    const systemPrompt = `You are a revenue growth advisor for a solo entrepreneur. Analyze the revenue data below and provide specific, actionable advice.

Revenue Data (current month):
${revenueLines || '- No revenue data available'}

Total Monthly Revenue: $${total.toFixed(2)}

Respond in this EXACT JSON format (no markdown, just raw JSON):
{
  "top_actions": [
    "Action 1: specific and measurable",
    "Action 2: specific and measurable",
    "Action 3: specific and measurable"
  ],
  "underperforming": "Which revenue stream is lagging and why in 1-2 sentences",
  "projected_impact": "Estimated monthly revenue increase if top actions are taken, in 1-2 sentences with a $ figure"
}`

    // 4. Call Claude
    const client = getAnthropicClient()
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: systemPrompt }],
    })

    // 5. Parse response
    let parsed: { top_actions: string[]; underperforming: string; projected_impact: string }

    try {
      const block = message.content[0]
      const text = block.type === 'text' ? block.text : ''
      parsed = JSON.parse(text)
    } catch {
      parsed = {
        top_actions: [
          'Review revenue streams and identify growth opportunities',
          'Optimize highest-performing channels',
          'Reduce dependency on single revenue source',
        ],
        underperforming: 'Unable to parse advisor response. Please try again.',
        projected_impact: 'Impact analysis unavailable due to parsing error.',
      }
    }

    // 6. Build AdvisorOutput
    const advisorOutput: AdvisorOutput = {
      top_actions: parsed.top_actions,
      underperforming: parsed.underperforming,
      projected_impact: parsed.projected_impact,
      generated_at: new Date().toISOString(),
      revenue_snapshot: revenueRows.map((row) => ({
        source: row.source,
        amount_usd: row.amount_usd,
      })),
    }

    // 7. Store in revenue_cache
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: upsertError } = await (supabase.from('revenue_cache') as any).upsert(
      {
        id: 'ai_advisor',
        source: 'ai_advisor',
        amount_usd: 0,
        period: new Date().toISOString().slice(0, 7),
        metadata: advisorOutput as unknown as Record<string, unknown>,
      },
      { onConflict: 'id' }
    )

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 })
    }

    return NextResponse.json({ advice: advisorOutput })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
