// app/(dashboard)/layout.tsx

import { createClient } from '@/lib/supabase/server'

import { redirect } from 'next/navigation'

import type { ReactNode } from 'react'

import { DashboardHeader } from '@/components/dashboard/header'



export default async function DashboardLayout({

  children,

}: {

  children: ReactNode

}) {

  const supabase = await createClient()

  

  const {

    data: { user },

  } = await supabase.auth.getUser()



  if (!user) {

    redirect('/login')

  }



  const { data: profile } = await supabase

    .from('profiles')

    .select('*')

    .eq('id', user.id)

    .single()

  if (!profile) {

    redirect('/login')

  }



  return (

    <div className="flex min-h-screen">

      <div className="flex-1">

        <DashboardHeader profile={profile} />

        <main className="p-6">

          {children}

        </main>

      </div>

    </div>

  )

}