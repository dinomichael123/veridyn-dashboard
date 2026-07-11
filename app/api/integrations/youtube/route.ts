import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { YouTubeChannelData } from '@/lib/integrations/nexlev'

// GET: read cached youtube data from revenue_cache
export async function GET() {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('revenue_cache')
      .select('*')
      .like('source', 'youtube%')
      .order('updated_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: data ?? [] })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// POST: upsert youtube data (body: { channels: YouTubeChannelData[] })
export async function POST(request: Request) {
  try {
    const body = await request.json() as { channels: YouTubeChannelData[] }
    const { channels } = body

    if (!Array.isArray(channels)) {
      return NextResponse.json({ error: 'channels must be an array' }, { status: 400 })
    }

    const supabase = createClient()
    const period = new Date().toISOString().slice(0, 7) // YYYY-MM

    const rows = channels.map(channel => ({
      id: `youtube_${channel.channel_id}`,
      source: `youtube_${channel.channel_id}`,
      amount_usd: channel.estimated_monthly_revenue,
      period,
      metadata: channel as unknown as Record<string, unknown>,
    }))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('revenue_cache') as any).upsert(rows, { onConflict: 'id' })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, upserted: rows.length })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
