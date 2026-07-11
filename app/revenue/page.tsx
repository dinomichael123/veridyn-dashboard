export const dynamic = 'force-dynamic'

import { RevenueSummaryCard } from '@/components/panels/RevenueSummaryCard'
import { RevenueSourcesPanel } from '@/components/panels/RevenueSourcesPanel'
import { YouTubeDeepDivePanel } from '@/components/panels/YouTubeDeepDivePanel'

export default function RevenuePage() {
  return (
    <div>
      <RevenueSummaryCard />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <RevenueSourcesPanel />
        <YouTubeDeepDivePanel />
      </div>
    </div>
  )
}
