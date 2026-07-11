import { NextRequest, NextResponse } from 'next/server'
import { textToSpeech } from '@/lib/elevenlabs'

export async function POST(req: NextRequest) {
  if (!process.env.ELEVENLABS_API_KEY) {
    return NextResponse.json({ error: 'ELEVENLABS_API_KEY not configured' }, { status: 503 })
  }

  let text: string
  let voice_id: string

  try {
    const body = await req.json()
    text = body.text ?? ''
    voice_id = body.voice_id ?? ''
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!text.trim()) {
    return NextResponse.json({ error: 'text is required' }, { status: 400 })
  }
  if (!voice_id.trim()) {
    return NextResponse.json({ error: 'voice_id is required' }, { status: 400 })
  }

  try {
    const audioBuffer = await textToSpeech(text, voice_id)
    return new Response(new Uint8Array(audioBuffer), {
      headers: { 'Content-Type': 'audio/mpeg' },
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
