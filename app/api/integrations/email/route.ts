import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { KlaviyoData } from '@/lib/integrations/klaviyo'

// GET: read cached Klaviyo data from revenue_cache
export async function GET() {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('revenue_cache')
      .select('*')
      .eq('source', 'klaviyo')
      .order('updated_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: data ?? [] })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// POST: upsert Klaviyo data (body: { data: KlaviyoData })
export async function POST(request: Request) {
  try {
    const body = await request.json() as { data: KlaviyoData }
    const emailData = body.data

    if (!emailData || typeof emailData !== 'object') {
      return NextResponse.json({ error: 'data must be a KlaviyoData object' }, { status: 400 })
    }

    const supabase = createClient()
    const period = new Date().toISOString().slice(0, 7)

    const row = {
      id: 'klaviyo',
      source: 'klaviyo',
      amount_usd: emailData.attributed_revenue_mtd,
      period,
      metadata: emailData as unknown as Record<string, unknown>,
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
