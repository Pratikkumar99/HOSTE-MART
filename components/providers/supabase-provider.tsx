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
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        router.replace('/login')
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        router.refresh()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, supabase])

  return <>{children}</>
}