export const dynamic = 'force-dynamic'

import { SessionsPanel } from '@/components/panels/SessionsPanel'
import { TasksPanel } from '@/components/panels/TasksPanel'
import { MemoryPanel } from '@/components/panels/MemoryPanel'
import { SkillsPanel } from '@/components/panels/SkillsPanel'
import { ScheduledJobsPanel } from '@/components/panels/ScheduledJobsPanel'

export default function ClaudePage() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <SessionsPanel />
      <TasksPanel />
      <ScheduledJobsPanel />
      <MemoryPanel />
      <div className="md:col-span-2">
        <SkillsPanel />
      </div>
    </div>
  )
}
