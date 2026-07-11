import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { TabNav } from '@/components/layout/TabNav'
import { StatusBar } from '@/components/layout/StatusBar'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Command Dashboard',
  description: 'Claude + Business Command Center',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-zinc-950 text-zinc-100 min-h-screen`}>
        <StatusBar />
        <TabNav />
        <main className="pt-24 pb-8 px-4 max-w-7xl mx-auto">{children}</main>
        <Toaster />
      </body>
    </html>
  )
}
