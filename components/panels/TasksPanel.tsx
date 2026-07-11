'use client'
import { useRealtimeTable } from '@/hooks/useRealtimeTable'
import type { Task } from '@/lib/supabase/types'
import { cn } from '@/lib/utils'

const statusColor: Record<Task['status'], string> = {
  pending: 'bg-zinc-700 text-zinc-300',
  in_progress: 'bg-blue-900 text-blue-300',
  completed: 'bg-green-900 text-green-300',
  deleted: 'bg-red-900 text-red-300',
}

export function TasksPanel() {
  const { data: allTasks, loading } = useRealtimeTable<Task>('tasks')
  const tasks = allTasks.filter(t => t.status !== 'deleted')

  if (loading) return <div className="panel animate-pulse h-48" />

  return (
    <div className="panel">
      <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
        Tasks <span className="text-zinc-600 font-normal">({tasks.length})</span>
      </h2>
      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {tasks.length === 0 && <p className="text-zinc-500 text-sm">No tasks.</p>}
        {tasks.map(t => (
          <div key={t.id} className="flex items-center gap-3 p-2 bg-zinc-800 rounded-lg">
            <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium shrink-0', statusColor[t.status])}>
              {t.status.replace('_', ' ')}
            </span>
            <p className="text-sm text-zinc-200 flex-1 truncate">{t.subject}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
