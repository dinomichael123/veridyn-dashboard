'use client'
import { useState, type FormEvent } from 'react'
import { useRealtimeTable } from '@/hooks/useRealtimeTable'
import type { JobBoard } from '@/lib/supabase/types'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

const COLUMNS: { key: JobBoard['status']; label: string; color: string }[] = [
  { key: 'backlog',     label: 'Backlog',     color: 'border-zinc-600' },
  { key: 'in_progress', label: 'In Progress', color: 'border-blue-500' },
  { key: 'review',      label: 'Review',      color: 'border-amber-500' },
  { key: 'done',        label: 'Done',        color: 'border-green-500' },
]

function fmtDate(iso: string | null) {
  if (!iso) return 'No deadline'
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const EMPTY_FORM = { title: '', client: '', value_usd: 0, deadline: '', notes: '' }

export function JobsBoardPanel() {
  const { data: jobs, loading } = useRealtimeTable<JobBoard>('jobs_board', { orderBy: 'updated_at' })
  const [selectedJob, setSelectedJob] = useState<JobBoard | null>(null)
  const [newJobOpen, setNewJobOpen] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [submitting, setSubmitting] = useState(false)

  async function handleStatusChange(jobId: string, newStatus: JobBoard['status']) {
    const supabase = createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('jobs_board') as any).update({ status: newStatus }).eq('id', jobId)
  }

  async function handleAddJob(e: FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return
    setSubmitting(true)
    const supabase = createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('jobs_board') as any).insert({
      title: form.title.trim(),
      client: form.client.trim() || null,
      value_usd: Number(form.value_usd) || 0,
      deadline: form.deadline || null,
      notes: form.notes.trim() || null,
      status: 'backlog',
    })
    setSubmitting(false)
    setForm({ ...EMPTY_FORM })
    setNewJobOpen(false)
  }

  return (
    <div className="panel">
      {/* Panel header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
          Jobs Board
        </h2>
        <Button size="sm" onClick={() => setNewJobOpen(true)}>
          + New Job
        </Button>
      </div>

      {/* Kanban grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {COLUMNS.map(col => {
          const colJobs = jobs.filter(j => j.status === col.key)
          return (
            <div key={col.key} className="flex flex-col gap-2 min-w-0">
              {/* Column header */}
              <div className={`flex items-center gap-1.5 pb-1.5 border-b-2 ${col.color}`}>
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                  {col.label}
                </span>
                <span className="text-xs text-zinc-500">
                  ({loading ? '…' : colJobs.length})
                </span>
              </div>

              {/* Loading skeletons */}
              {loading && Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))}

              {/* Empty state */}
              {!loading && colJobs.length === 0 && (
                <p className="text-zinc-600 text-xs text-center py-6">No jobs</p>
              )}

              {/* Job cards */}
              {!loading && colJobs.map(job => (
                <div
                  key={job.id}
                  className={`bg-zinc-800 rounded-lg p-3 border-l-4 ${col.color} cursor-pointer hover:bg-zinc-700 transition-colors`}
                  onClick={() => setSelectedJob(job)}
                >
                  <p className="font-medium text-sm text-zinc-100 truncate">{job.title}</p>
                  <p className="text-xs text-zinc-400 mt-0.5 truncate">{job.client ?? '—'}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-zinc-300 font-medium">
                      ${job.value_usd.toLocaleString()}
                    </span>
                    <span className="text-xs text-zinc-500">{fmtDate(job.deadline)}</span>
                  </div>
                  {/* Status select — stops click propagation so it doesn't open the detail dialog */}
                  <select
                    value={job.status}
                    onClick={e => e.stopPropagation()}
                    onChange={e => {
                      e.stopPropagation()
                      handleStatusChange(job.id, e.target.value as JobBoard['status'])
                    }}
                    className="mt-2 w-full text-xs bg-zinc-700 border border-zinc-600 rounded px-1.5 py-0.5 text-zinc-300 cursor-pointer focus:outline-none focus:border-zinc-400"
                  >
                    {COLUMNS.map(c => (
                      <option key={c.key} value={c.key}>{c.label}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )
        })}
      </div>

      {/* Card detail dialog */}
      <Dialog
        open={selectedJob !== null}
        onOpenChange={(open) => { if (!open) setSelectedJob(null) }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedJob?.title}</DialogTitle>
          </DialogHeader>
          {selectedJob && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-1 border-b border-zinc-800">
                <span className="text-zinc-400">Client</span>
                <span className="text-zinc-200">{selectedJob.client ?? '—'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800">
                <span className="text-zinc-400">Value</span>
                <span className="text-zinc-200 font-medium">${selectedJob.value_usd.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800">
                <span className="text-zinc-400">Deadline</span>
                <span className="text-zinc-200">{fmtDate(selectedJob.deadline)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800">
                <span className="text-zinc-400">Status</span>
                <span className="text-zinc-200 capitalize">{selectedJob.status.replace('_', ' ')}</span>
              </div>
              {selectedJob.notes && (
                <div className="pt-1">
                  <p className="text-zinc-400 text-xs mb-1.5">Notes</p>
                  <p className="text-zinc-300 bg-zinc-800 rounded-lg p-3 text-xs whitespace-pre-wrap leading-relaxed">
                    {selectedJob.notes}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>

      {/* New job dialog */}
      <Dialog open={newJobOpen} onOpenChange={setNewJobOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Job</DialogTitle>
          </DialogHeader>
          <form id="new-job-form" onSubmit={handleAddJob} className="space-y-3 text-sm">
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Title *</label>
              <input
                required
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-400"
                placeholder="Job title"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Client</label>
              <input
                value={form.client}
                onChange={e => setForm(f => ({ ...f, client: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-400"
                placeholder="Client name (optional)"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Value (USD)</label>
              <input
                type="number"
                min="0"
                value={form.value_usd}
                onChange={e => setForm(f => ({ ...f, value_usd: Number(e.target.value) }))}
                className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-1.5 text-sm text-zinc-100 focus:outline-none focus:border-zinc-400"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Deadline</label>
              <input
                type="date"
                value={form.deadline}
                onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-1.5 text-sm text-zinc-100 focus:outline-none focus:border-zinc-400"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Notes</label>
              <textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={3}
                className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-400 resize-none"
                placeholder="Optional notes…"
              />
            </div>
          </form>
          <DialogFooter>
            <Button type="submit" form="new-job-form" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create Job'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
