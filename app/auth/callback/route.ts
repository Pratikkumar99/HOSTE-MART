import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const cookieStore = await cookies()
    const supabase = await createClient()

    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (!error) {
        // For now, just redirect to google-signup for all Google users
        // The page itself will handle checking if profile exists
        return NextResponse.redirect(`${origin}/google-signup`)
      }
    } catch (error) {
      console.error('Error exchanging code for session:', error)
    }
  }

  // If there's an error or no code, redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=Authentication failed`)
}
