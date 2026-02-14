import type { Metadata } from 'next'

import type { ReactNode } from 'react'

import './globals.css'

import { SupabaseProvider } from '@/components/providers/supabase-provider'
import { Toaster } from '@/components/ui/sonner'

export const metadata: Metadata = {
  title: 'HostelMart',
  description: 'Connect with your hostel community',
  icons: {
    icon: '/logo.png',
  }
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <SupabaseProvider>
          {children}
          <Toaster />
        </SupabaseProvider>
      </body>
    </html>
  )
}