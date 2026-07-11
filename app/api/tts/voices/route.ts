import { NextResponse } from 'next/server'
import { getVoices } from '@/lib/elevenlabs'

export async function GET() {
  if (!process.env.ELEVENLABS_API_KEY) {
    return NextResponse.json({ voices: [] })
  }

  try {
    const voices = await getVoices()
    return NextResponse.json({ voices })
  } catch (err) {
    return NextResponse.json({ error: String(err), voices: [] }, { status: 500 })
  }
}
