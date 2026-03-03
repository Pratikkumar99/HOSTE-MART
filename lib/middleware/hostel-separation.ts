// lib/middleware/hostel-separation.ts
import { createClient } from '@/lib/supabase/server'

export async function enforceHostelSeparation(
  userId: string,
  targetHostelType: 'boys' | 'girls' | 'both'
): Promise<boolean> {
  const supabase = await createClient()
  
  // Get user's hostel type
  const { data: profile } = await supabase
    .from('profiles')
    .select('hostel_type')
    .eq('id', userId)
    .single()
  
  if (!profile) return false
  
  // Users can only access content from their own hostel type or 'both'
  if (targetHostelType === 'both') return true
  
  return profile.hostel_type === targetHostelType
}

export async function getUserHostelType(userId: string): Promise<'boys' | 'girls' | null> {
  const supabase = await createClient()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('hostel_type')
    .eq('id', userId)
    .single()
  
  return profile?.hostel_type || null
}

export async function filterContentByHostel(
  userId: string,
  contentType: 'businesses' | 'products' | 'requests' | 'sales'
) {
  const supabase = await createClient()
  const userHostelType = await getUserHostelType(userId)
  
  if (!userHostelType) return { data: [], error: 'User hostel type not found' }
  
  let query
  switch (contentType) {
    case 'businesses':
      query = supabase
        .from('businesses')
        .select('*')
        .eq('status', 'active')
        .eq('hostel_type', userHostelType)
      break
    case 'products':
      query = supabase
        .from('products')
        .select(`
          *,
          businesses!owner_id(hostel_type)
        `)
        .eq('status', 'active')
      break
    case 'requests':
      query = supabase
        .from('item_requests')
        .select(`
          *,
          profiles!requester_id(hostel_type)
        `)
        .eq('status', 'open')
      break
    case 'sales':
      query = supabase
        .from('items_for_sale')
        .select(`
          *,
          businesses!seller_id(hostel_type)
        `)
        .eq('status', 'active')
      break
    default:
      return { data: [], error: 'Invalid content type' }
  }
  
  const { data, error } = await query
  
  if (error) return { data: [], error }
  
  // Additional filtering for joined tables
  let filteredData = data || []
  
  if (contentType === 'products' || contentType === 'sales') {
    filteredData = filteredData.filter(item => 
      item.businesses?.hostel_type === userHostelType
    )
  } else if (contentType === 'requests') {
    filteredData = filteredData.filter(item => 
      item.profiles?.hostel_type === userHostelType
    )
  }
  
  return { data: filteredData, error: null }
}
