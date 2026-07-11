'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const tabs = [
  { href: '/claude', label: 'Claude' },
  { href: '/business', label: 'Business' },
  { href: '/revenue', label: 'Revenue' },
  { href: '/voice', label: 'Voice' },
]

export function TabNav() {
  const path = usePathname()
  return (
    <nav className="fixed top-10 left-0 right-0 z-40 bg-zinc-950/90 backdrop-blur border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 flex gap-1">
        {tabs.map(t => (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              'px-5 py-3 text-sm font-medium transition-colors',
              path.startsWith(t.href)
                ? 'text-white border-b-2 border-violet-500'
                : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
