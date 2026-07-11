import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET: read cached Slack summary from revenue_cache
export async function GET() {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('revenue_cache')
      .select('*')
      .eq('source', 'slack_summary')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: data ?? null })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// POST: upsert Slack summary (body: { summary: string; bullets: string[] })
export async function POST(request: Request) {
  try {
    const body = await request.json() as { summary: string; bullets: string[] }
    const { summary, bullets } = body

    if (typeof summary !== 'string') {
      return NextResponse.json({ error: 'summary must be a string' }, { status: 400 })
    }

    const supabase = createClient()

    const row = {
      id: 'slack_summary',
      source: 'slack_summary',
      amount_usd: 0,
      period: null,
      metadata: {
        summary,
        bullets: bullets ?? [],
        synced_at: new Date().toISOString(),
      } as unknown as Record<string, unknown>,
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('revenue_cache') as any).upsert(row, { onConflict: 'id' })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
