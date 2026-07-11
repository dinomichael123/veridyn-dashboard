'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

type DaemonRow = Database['public']['Tables']['daemon_status']['Row']

export function useDaemonStatus() {
  const [isOnline, setIsOnline] = useState(false)
  const [lastHeartbeat, setLastHeartbeat] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    supabase
      .from('daemon_status')
      .select('*')
      .single()
      .then(({ data }) => {
        if (data) {
          const row = data as unknown as DaemonRow
          setIsOnline(row.is_online)
          setLastHeartbeat(row.last_heartbeat)
        }
      })

    const channel = supabase
      .channel('daemon-status')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'daemon_status' },
        ({ new: row }) => {
          const r = row as unknown as DaemonRow
          setIsOnline(r.is_online)
          setLastHeartbeat(r.last_heartbeat)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  return { isOnline, lastHeartbeat }
}
