export const dynamic = 'force-dynamic'

import { JobsBoardPanel } from '@/components/panels/JobsBoardPanel'
import { ContentCalendarPanel } from '@/components/panels/ContentCalendarPanel'
import { SeoTrafficPanel } from '@/components/panels/SeoTrafficPanel'
import { EmailMarketingPanel } from '@/components/panels/EmailMarketingPanel'
import { SlackFeedPanel } from '@/components/panels/SlackFeedPanel'

export default function BusinessPage() {
  return (
    <div className="space-y-4">
      <JobsBoardPanel />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ContentCalendarPanel />
        <SeoTrafficPanel />
        <EmailMarketingPanel />
        <div className="md:col-span-2">
          <SlackFeedPanel />
        </div>
      </div>
    </div>
  )
}
