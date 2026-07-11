'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

export interface Toast {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
}

let listeners: Array<(toasts: Toast[]) => void> = []
let toasts: Toast[] = []

function dispatch(toast: Toast) {
  toasts = [{ ...toast, id: toast.id ?? String(Date.now()) }, ...toasts].slice(0, 5)
  listeners.forEach(l => l(toasts))
  setTimeout(() => {
    toasts = toasts.filter(t => t.id !== toast.id)
    listeners.forEach(l => l(toasts))
  }, 5000)
}

export function toast(opts: Omit<Toast, 'id'> & { id?: string }) {
  dispatch({ id: String(Date.now()), ...opts })
}

export function Toaster() {
  const [items, setItems] = useState<Toast[]>([])

  useEffect(() => {
    listeners.push(setItems)
    return () => {
      listeners = listeners.filter(l => l !== setItems)
    }
  }, [])

  if (items.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {items.map(item => (
        <div
          key={item.id}
          className={cn(
            'rounded-md border px-4 py-3 shadow-md min-w-[200px] max-w-[360px]',
            item.variant === 'destructive'
              ? 'border-destructive bg-destructive text-destructive-foreground'
              : 'border-border bg-card text-card-foreground'
          )}
        >
          {item.title && <p className="font-semibold text-sm">{item.title}</p>}
          {item.description && <p className="text-sm opacity-90">{item.description}</p>}
        </div>
      ))}
    </div>
  )
}
