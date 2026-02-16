'use client'

import { ChangePasswordForm } from '@/components/auth/change-password-form'
import { createClient } from '@/lib/supabase/client'
import { redirect } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function ChangePasswordPage() {
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        redirect('/login?redirectTo=/settings/change-password')
      }
      setLoading(false)
    }
    checkSession()
  }, [supabase])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <ChangePasswordForm />
      </div>
    </div>
  )
}
