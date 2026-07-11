export const dynamic = 'force-dynamic'

import { JobsBoardPanel } from '@/components/panels/JobsBoardPanel'

export default function BusinessPage() {
  return (
    <div className="space-y-4">
      <JobsBoardPanel />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="panel">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
            Content Calendar
          </h2>
          <p className="text-xs text-zinc-600 mt-1">YouTube scheduling — coming in Task 9</p>
        </div>
        <div className="panel">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
            SEO &amp; Traffic
          </h2>
          <p className="text-xs text-zinc-600 mt-1">Semrush data — coming in Task 10</p>
        </div>
        <div className="panel md:col-span-2">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
            Email &amp; Marketing
          </h2>
          <p className="text-xs text-zinc-600 mt-1">Klaviyo data — coming in Task 10</p>
        </div>
      </div>
    </div>
  )
}
