import { createClient } from '@/lib/supabase/client'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const cookieStore = cookies()
    const supabase = createClient()

    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (!error) {
        // Successfully verified email, redirect to dashboard
        return NextResponse.redirect(`${origin}${next}`)
      }
    } catch (error) {
      console.error('Error exchanging code for session:', error)
    }
  }

  // If there's an error or no code, redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=Email verification failed`)
}
