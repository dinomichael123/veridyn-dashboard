'use client'
import { useDaemonStatus } from '@/hooks/useDaemonStatus'
import { Mic } from 'lucide-react'
import Link from 'next/link'

export function StatusBar() {
  const { isOnline, lastHeartbeat } = useDaemonStatus()
  const ago = lastHeartbeat
    ? Math.round((Date.now() - new Date(lastHeartbeat).getTime()) / 1000)
    : null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-10 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between px-4 text-xs text-zinc-400">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
        <span>{isOnline ? 'Daemon online' : 'Daemon offline'}</span>
        {ago !== null && <span>· synced {ago}s ago</span>}
      </div>
      <Link href="/voice" className="flex items-center gap-1 hover:text-white transition-colors">
        <Mic className="w-3 h-3" />
        <span>Voice</span>
      </Link>
    </div>
  )
}
