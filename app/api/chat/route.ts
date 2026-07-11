import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAnthropicClient } from '@/lib/anthropic'
import type { Json } from '@/lib/supabase/types'

const EXCLUDED_REVENUE_SOURCES = ['ai_advisor', 'semrush_organic', 'slack_summary']

interface AdvisorOutput {
  top_actions: string[]
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 503 })
  }

  let message: string
  let history: Array<{ role: 'user' | 'assistant'; content: string }> = []

  try {
    const body = await req.json()
    message = body.message ?? ''
    history = body.history ?? []
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!message.trim()) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 })
  }

  try {
    const supabase = createClient()

    // 1. Fetch latest 5 sessions (is_running=true first)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: sessionsData } = await (supabase.from('sessions') as any)
      .select('id, title, cwd, is_running')
      .order('is_running', { ascending: false })
      .order('last_activity_at', { ascending: false })
      .limit(5)

    const sessions = (sessionsData ?? []) as Array<{
      id: string
      title: string
      cwd: string | null
      is_running: boolean
    }>

    // 2. Fetch latest 10 tasks (status != 'deleted')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: tasksData } = await (supabase.from('tasks') as any)
      .select('id, subject, status')
      .neq('status', 'deleted')
      .order('updated_at', { ascending: false })
      .limit(10)

    const tasks = (tasksData ?? []) as Array<{
      id: string
      subject: string
      status: string
    }>

    // 3. Fetch revenue_cache rows (amount_usd > 0, exclude advisor/seo/slack)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: revenueData } = await (supabase.from('revenue_cache') as any)
      .select('source, amount_usd')
      .gt('amount_usd', 0)
      .order('updated_at', { ascending: false })

    const revenueRows = ((revenueData ?? []) as Array<{ source: string; amount_usd: number }>)
      .filter((r) => !EXCLUDED_REVENUE_SOURCES.includes(r.source))

    // 4. Fetch latest ai_advisor
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: advisorData } = await (supabase.from('revenue_cache') as any)
      .select('metadata')
      .eq('source', 'ai_advisor')
      .order('updated_at', { ascending: false })
      .limit(1)

    const advisorRow = (advisorData as Array<{ metadata: Json | null }>)?.[0]
    const advisorMeta = advisorRow?.metadata as AdvisorOutput | null

    // 5. Build system prompt
    const sessionLines = sessions.length
      ? sessions
          .map((s) => `- ${s.title} (${s.is_running ? 'RUNNING' : 'idle'})${s.cwd ? ` in ${s.cwd}` : ''}`)
          .join('\n')
      : '- No active sessions'

    const activeTasks = tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress')
    const taskLines = activeTasks.length
      ? activeTasks.map((t) => `- [${t.status}] ${t.subject}`).join('\n')
      : '- No active tasks'

    const revenueLines = revenueRows.length
      ? revenueRows.map((r) => `- ${r.source}: $${r.amount_usd}`).join('\n')
      : '- No revenue data'

    const adviceLines =
      advisorMeta?.top_actions?.length
        ? advisorMeta.top_actions.map((a) => `- ${a}`).join('\n')
        : 'None generated yet'

    const today = new Date().toISOString().slice(0, 10)

    const systemPrompt = `You are the AI assistant for this personal command dashboard. You have access to real-time data about the user's Claude sessions, tasks, and business revenue.

Current Claude Sessions:
${sessionLines}

Active Tasks:
${taskLines}

Revenue This Month:
${revenueLines}

Current Revenue Advice:
${adviceLines}

Today's date: ${today}

Respond conversationally and helpfully. When the user asks you to create tasks or add jobs, acknowledge that you'll note it (the voice interface will handle action extraction separately).`

    // 6. Call Claude
    const client = getAnthropicClient()
    const aiMessage = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        ...history,
        { role: 'user', content: message },
      ],
    })

    const replyBlock = aiMessage.content[0]
    const reply = replyBlock.type === 'text' ? replyBlock.text : ''

    // 7. Store both messages in chat_history
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('chat_history') as any).insert([
      { role: 'user', content: message },
      { role: 'assistant', content: reply },
    ])

    return NextResponse.json({ reply })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
