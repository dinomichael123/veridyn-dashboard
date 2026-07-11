'use client'
import { useState } from 'react'
import { useRealtimeTable } from '@/hooks/useRealtimeTable'
import type { MemoryFile } from '@/lib/supabase/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const typeColor: Record<string, string> = {
  user: 'bg-violet-900 text-violet-300',
  feedback: 'bg-amber-900 text-amber-300',
  project: 'bg-blue-900 text-blue-300',
  reference: 'bg-green-900 text-green-300',
}

export function MemoryPanel() {
  const { data: memories, loading } = useRealtimeTable<MemoryFile>('memory_files', { orderBy: 'updated_at' })
  const [selected, setSelected] = useState<MemoryFile | null>(null)

  if (loading) return <div className="panel animate-pulse h-48" />

  return (
    <div className="panel">
      <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
        Memory ({memories.length})
      </h2>
      <div className="space-y-2 max-h-72 overflow-y-auto">
        {memories.length === 0 && <p className="text-zinc-500 text-sm">No memory files found.</p>}
        {memories.map(m => (
          <button
            key={m.id}
            onClick={() => setSelected(m)}
            className="w-full text-left flex items-center gap-2 p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors"
          >
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${typeColor[m.type ?? 'reference']}`}>
              {m.type ?? 'reference'}
            </span>
            <span className="text-sm text-zinc-200 truncate">{m.name}</span>
          </button>
        ))}
      </div>
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-2xl bg-zinc-900 border-zinc-700">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">{selected?.name}</DialogTitle>
          </DialogHeader>
          <pre className="text-xs text-zinc-300 whitespace-pre-wrap max-h-96 overflow-y-auto font-mono">
            {selected?.content}
          </pre>
        </DialogContent>
      </Dialog>
    </div>
  )
}
