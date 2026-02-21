import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CreateItemForm } from '@/components/items/create-item-form'
import { BackButton } from '@/components/ui/back-button'

export default async function NewItemPage() {
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
    <div>
      <BackButton />
      <div className="max-w-3xl mx-auto">
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Sell an Item</h1>
        <p className="text-gray-600 mt-2">List something you want to sell to your hostel community.</p>
      </div>

      <div className="bg-white rounded-xl border p-6 dark:bg-black dark:border dark:border-white/30">
        <CreateItemForm userId={user.id} hostelType={profile.hostel_type} />
      </div>
    </div>
    </div>
  )
}
