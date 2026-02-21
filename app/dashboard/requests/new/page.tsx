import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CreateRequestForm } from '@/components/requests/create-request-form'
import { BackButton } from '@/components/ui/back-button'

export default async function NewRequestPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  return (
    <div >
      <BackButton />
      <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Make a Request</h1>
        <p className="text-gray-600 mt-2">Ask hostel mates for something you need.</p>
      </div>

      <div className="bg-white rounded-xl border p-6 dark:bg-black dark:border-white/30">
        <CreateRequestForm userId={user.id} hostelType={profile.hostel_type} />
      </div>
    </div>
    </div>
  )
}
