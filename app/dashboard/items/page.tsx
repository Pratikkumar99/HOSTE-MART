// app/(dashboard)/items/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Package, Search, Filter } from 'lucide-react'
import Link from 'next/link'

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

  // Apply price filter
  const minPrice = params.minPrice as string
  const maxPrice = params.maxPrice as string
  if (minPrice) {
    query = query.gte('price', minPrice)
  }
  if (maxPrice) {
    query = query.lte('price', maxPrice)
  }

  // Apply condition filter
  const condition = params.condition as string
  if (condition && condition !== 'all') {
    query = query.eq('condition', condition)
  }

  const { data: items } = await query.order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <BackButton />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Buy Items</h1>
          <p className="text-gray-600 mt-2">
            Browse items available in {profile.hostel_type === 'boys' ? 'boys' : 'girls'} hostel
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/items/new">
            <Package className="mr-2 h-4 w-4" />
            Sell Item
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border p-4">
        <form className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              name="search"
              placeholder="Search items..."
              className="pl-10"
              defaultValue={search}
            />
          </div>
          
          <Select name="category" defaultValue={category}>
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="books">Books & Notes</SelectItem>
              <SelectItem value="electronics">Electronics</SelectItem>
              <SelectItem value="furniture">Furniture</SelectItem>
              <SelectItem value="clothing">Clothing</SelectItem>
              <SelectItem value="sports">Sports Equipment</SelectItem>
              <SelectItem value="stationery">Stationery</SelectItem>
            </SelectContent>
          </Select>
          
          <Select name="condition" defaultValue={condition}>
            <SelectTrigger>
              <SelectValue placeholder="Condition" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Conditions</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="like_new">Like New</SelectItem>
              <SelectItem value="good">Good</SelectItem>
              <SelectItem value="fair">Fair</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex gap-2">
            <Input
              name="minPrice"
              placeholder="Min ₹"
              type="number"
              defaultValue={minPrice}
            />
            <Input
              name="maxPrice"
              placeholder="Max ₹"
              type="number"
              defaultValue={maxPrice}
            />
          </div>
          
          <div className="flex gap-2">
            <Button type="submit" className="flex-1 gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            <Button type="reset" variant="outline" asChild>
              <Link href="/dashboard/items">Clear</Link>
            </Button>
          </div>
        </form>
      </div>

      {/* Items Grid */}
      {items && items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/dashboard/items/${item.id}`}
              className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow bg-white"
            >
              <div className="aspect-square bg-gray-100 relative">
                {item.images && (
                  <img
                    src={item.images}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="p-4">
                <h3 className="font-medium text-gray-900 mb-1 line-clamp-1">{item.title}</h3>
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{item.description}</p>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-900">₹{item.price}</span>
                  <span className="text-xs text-gray-500">{item.condition}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
          <p className="text-gray-600 mb-4">
            {search ? 'Try adjusting your search filters' : 'No items have been listed yet'}
          </p>
          {search && (
            <Button asChild variant="outline">
              <Link href="/dashboard/items">Clear Filters</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  )
}