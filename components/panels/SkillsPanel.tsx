'use client'
import { useState } from 'react'
import { useRealtimeTable } from '@/hooks/useRealtimeTable'
import type { Skill } from '@/lib/supabase/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export function SkillsPanel() {
  const { data: skills, loading } = useRealtimeTable<Skill>('skills', { orderBy: 'updated_at' })
  const [selected, setSelected] = useState<Skill | null>(null)

  if (loading) return <div className="panel animate-pulse h-32" />

  return (
    <div className="panel">
      <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
        Skills ({skills.length})
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {skills.length === 0 && <p className="text-zinc-500 text-sm col-span-full">No skills found.</p>}
        {skills.map(s => (
          <button
            key={s.id}
            onClick={() => setSelected(s)}
            className="text-left p-3 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors"
          >
            <p className="text-sm font-medium text-zinc-100">{s.name}</p>
            {s.description && (
              <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{s.description}</p>
            )}
          </button>
        ))}
      </div>
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-3xl bg-zinc-900 border-zinc-700">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">{selected?.name}</DialogTitle>
          </DialogHeader>
          <pre className="text-xs text-zinc-300 whitespace-pre-wrap max-h-[60vh] overflow-y-auto font-mono">
            {selected?.skill_md_content}
          </pre>
        </DialogContent>
      </Dialog>
    </div>
  )
}
