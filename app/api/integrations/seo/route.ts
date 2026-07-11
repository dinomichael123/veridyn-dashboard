import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { SemrushData } from '@/lib/integrations/semrush'

// GET: read cached Semrush data from revenue_cache
export async function GET() {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('revenue_cache')
      .select('*')
      .in('source', ['semrush_organic', 'semrush_backlinks'])
      .order('updated_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: data ?? [] })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// POST: upsert Semrush data (body: { data: SemrushData })
export async function POST(request: Request) {
  try {
    const body = await request.json() as { data: SemrushData }
    const seoData = body.data

    if (!seoData || typeof seoData !== 'object') {
      return NextResponse.json({ error: 'data must be a SemrushData object' }, { status: 400 })
    }

    const supabase = createClient()

    const row = {
      id: 'semrush_organic',
      source: 'semrush_organic',
      amount_usd: seoData.organic_traffic,
      period: null,
      metadata: seoData as unknown as Record<string, unknown>,
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
