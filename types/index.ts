import { User as SupabaseUser } from '@supabase/supabase-js';

export type User = Omit<SupabaseUser, 'id' | 'email'> & {
  id: string
  email: string
  name: string
  roll_number: string
  room_number: string
  hostel_type: 'boys' | 'girls'
  hostel_name: string
  phone_number?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export type Item = {
  id: string
  seller_id: string
  title: string
  description: string
  price: number
  category: string
  condition: 'new' | 'like_new' | 'good' | 'fair'
  status: 'available' | 'reserved' | 'sold'
  images: string[]
  hostel_visible_to: 'boys' | 'girls' | 'both'
  created_at: string
  updated_at: string
  seller?: User
}

export type Request = {
  id: string
  requester_id: string
  title: string
  description: string
  urgency: 'low' | 'medium' | 'high' | 'urgent'
  max_price: number | null
  category: string
  status: 'open' | 'fulfilled' | 'closed'
  hostel_type: 'boys' | 'girls'
  created_at: string
  updated_at: string
  requester?: User
}

export type ChatRoom = {
  id: string
  item_id?: string
  request_id?: string
  buyer_id: string
  seller_id: string
  status: 'active' | 'closed'
  created_at: string
  last_message_at: string
  item?: Item
  request?: Request
  buyer?: User
  seller?: User
}

export type Message = {
  id: string
  chat_room_id: string
  sender_id: string
  content: string
  read: boolean
  created_at: string
  is_system_message?: boolean
  sender?: User
}

export type Review = {
  id: string
  reviewer_id: string
  reviewed_id: string
  rating: number
  comment?: string
  created_at: string
}

export type Stats = {
  totalItems: number
  totalRequests: number
  activeChats: number
}

export type Notification = {
  id: string
  user_id: string
  title: string
  message: string
  type: 'match' | 'chat' | 'system'
  link_url?: string
  read: boolean
  created_at: string
}