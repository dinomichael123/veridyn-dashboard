'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useRealtimeTable<T extends { id: string | number }>(
  table: string,
  options?: { orderBy?: string; ascending?: boolean }
) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const orderBy = options?.orderBy ?? 'updated_at'
  const ascending = options?.ascending ?? false

  useEffect(() => {
    let query = supabase.from(table).select('*')
    // Only apply ordering if a column was specified
    if (orderBy) {
      query = query.order(orderBy, { ascending }) as any
    }
    query.then(({ data: rows }) => {
      setData((rows as T[]) ?? [])
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table])

  return { data, loading }
}
