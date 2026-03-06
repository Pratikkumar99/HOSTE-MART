import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AuthCallback() {
  const supabase = await createClient()
  
  // Get the user after OAuth callback
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Check if user has a profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // If no profile exists, it's a new Google user - redirect to complete profile
  if (!profile) {
    redirect('/google-signup')
  }

  // If profile exists, redirect to dashboard
  redirect('/dashboard')
}
