'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = useMemo(() => createClient(), [])

  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const code = searchParams.get('code')

    const run = async () => {
      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(window.location.search)
          if (error) {
            toast.error(error.message)
          }
        }
      } finally {
        setReady(true)
      }
    }

    run()
  }, [searchParams, supabase])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const password = formData.get('password') as string

    try {
      const { error } = await supabase.auth.updateUser({ password })

      if (error) {
        toast.error(error.message)
        return
      }

      toast.success('Password updated. Please sign in.')
      router.push('/login')
      router.refresh()
    } catch (err) {
      toast.error('Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  if (!ready) return null

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">New password</Label>
        <Input id="password" name="password" type="password" required minLength={6} />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Updating...' : 'Update password'}
      </Button>
    </form>
  )
}
