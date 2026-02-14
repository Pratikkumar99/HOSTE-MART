// app/(dashboard)/items/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ItemsList } from '@/components/items/items-list'
import { BackButton } from '@/components/ui/back-button'

export default async function ItemsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createClient()
  const params = await searchParams
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/setup-profile')

  // Build query based on filters
  let query = supabase
    .from('items')
    .select(`
      *,
      seller:profiles(name, room_number, hostel_name, avatar_url)
    `)
    .eq('status', 'available')
    .or(`hostel_visible_to.eq.both,hostel_visible_to.eq.${profile.hostel_type}`)

  // Apply search filter
  const search = params.search as string
  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
  }

  // Apply category filter
  const category = params.category as string
  if (category && category !== 'all') {
    query = query.eq('category', category)
  }

  // Apply condition filter
  const condition = params.condition as string
  if (condition && condition !== 'all') {
    query = query.eq('condition', condition)
  }

  const { data: items } = await query.order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <BackButton />
        <h1 className="text-3xl font-bold">Marketplace</h1>
        <p className="text-gray-600 mt-2">Browse and list items for sale</p>
      </div>

      <ItemsList 
        initialItems={items || []}
        currentUser={{
          id: user.id,
          hostel_type: profile.hostel_type
        }}
      />
    </div>
  )
}