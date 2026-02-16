'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'

export function SupabaseProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [supabase] = useState(() => createClient())

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: { type: string }) => {
      if (event.type === 'SIGNED_OUT') {
        router.replace('/login')
      } else if (event.type === 'SIGNED_IN' || event.type === 'TOKEN_REFRESHED' || event.type === 'USER_UPDATED') {
        router.refresh()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, supabase])

  return <>{children}</>
}