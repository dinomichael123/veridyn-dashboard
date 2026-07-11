'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useRealtimeTable<T extends { id: string | number }>(
  table: string,
  query?: (q: ReturnType<ReturnType<typeof createClient>['from']>) => unknown
) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const q = supabase.from(table).select('*').order('updated_at', { ascending: false })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(query ? (query(supabase.from(table)) as any) : q).then(({ data: rows }: { data: T[] | null }) => {
      setData(rows ?? [])
      setLoading(false)
    })

    const channel = supabase
      .channel(`rt-${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setData(prev => [payload.new as T, ...prev])
        } else if (payload.eventType === 'UPDATE') {
          setData(prev => prev.map(r => r.id === (payload.new as T).id ? payload.new as T : r))
        } else if (payload.eventType === 'DELETE') {
          setData(prev => prev.filter(r => r.id !== (payload.old as T).id))
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [table])

  return { data, loading }
}
