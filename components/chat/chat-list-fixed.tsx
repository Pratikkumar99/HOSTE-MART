// components/chat/chat-list-fixed.tsx

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
import { MessageSquare, Trash2, MoreHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

interface ChatRoom {
  id: string
  buyer_id: string
  seller_id: string
  item_id?: string
  request_id?: string
  status: 'active' | 'archived'
  last_message_at: string
  item?: { title: string; price: number }
  request?: { title: string }
  buyer?: { name: string; avatar_url: string }
  seller?: { name: string; avatar_url: string }
}

interface ChatListProps {
  userId: string
}

export function ChatListFixed({ userId }: ChatListProps) {
  const supabase = createClient()
  const [chats, setChats] = useState<ChatRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    loadChats()
  }, [userId])

  const loadChats = async () => {
    try {
      setLoading(true)
      console.log('🔄 Loading chats with cache-busting...')
      
      // Add cache-busting by creating a new client instance
      const freshSupabase = createClient()
      
      // First get user's hostel type
      const { data: profile } = await freshSupabase
        .from('profiles')
        .select('hostel_type')
        .eq('id', userId)
        .single()

      if (!profile) {
        console.error('❌ User profile not found')
        return
      }

      const { data, error } = await freshSupabase
        .from('chat_rooms')
        .select(`
          *,
          item:items(title, price),
          request:requests(title),
          buyer:profiles!chat_rooms_buyer_id_fkey(name, avatar_url, hostel_type),
          seller:profiles!chat_rooms_seller_id_fkey(name, avatar_url, hostel_type)
        `)
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
        .order('last_message_at', { ascending: false })

      if (error) {
        console.error('❌ Error loading chats:', error)
        return
      }

      // Filter chats to only include those with same hostel type
      const filteredChats = (data || []).filter(chat => {
        const partner = chat.buyer_id === userId ? chat.seller : chat.buyer
        return partner?.hostel_type === profile.hostel_type
      })

      console.log(`Loaded ${filteredChats.length} chats from database (filtered by hostel type)`)
      setChats(filteredChats)
    } catch (error) {
      console.error('Error loading chats:', error)
    } finally {
      setLoading(false)
    }
  }

  const getChatPartner = (chat: ChatRoom) => {
    return chat.buyer_id === userId ? chat.seller : chat.buyer
  }

  const getChatTitle = (chat: ChatRoom) => {
    if (chat.item) return `Item: ${chat.item.title}`
    if (chat.request) return `Request: ${chat.request.title}`
    return 'Chat'
  }

  const handleDeleteChat = async (chat: ChatRoom) => {
    if (!confirm(`Are you sure you want to delete "${getChatTitle(chat)}"? This action cannot be undone.`)) {
      return
    }

    try {
      setDeleting(chat.id)
      console.log('🗑️ Starting chat deletion:', chat.id)
      
      // First delete all messages in chat room using CORRECT column name
      console.log('📨 Deleting messages for chat:', chat.id)
      const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .eq('chat_room_id', chat.id)

      if (messagesError) {
        console.error('❌ Error deleting messages:', messagesError)
      } else {
        console.log('✅ Messages deleted successfully')
      }

      // Then delete the chat room
      console.log('💬 Deleting chat room:', chat.id)
      const { error } = await supabase
        .from('chat_rooms')
        .delete()
        .eq('id', chat.id)

      if (error) {
        console.error('❌ Error deleting chat:', error)
        throw error
      }

      console.log('✅ Successfully deleted chat room')
      toast.success('Chat deleted successfully')
      
      // Remove from local state
      setChats(prevChats => {
        const updated = prevChats.filter(c => c.id !== chat.id)
        console.log(`🔄 Updated local state: ${updated.length} chats remaining`)
        return updated
      })
      
      // Force a reload after a short delay to verify database consistency
      setTimeout(() => {
        console.log('🔄 Verifying database consistency...')
        // Create fresh client to bypass any cached data
        loadChats()
      }, 1000)
      
    } catch (error) {
      console.error('❌ Error deleting chat:', error)
      toast.error('Failed to delete chat')
    } finally {
      setDeleting(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-4 bg-gray-100 animate-pulse rounded-lg">
            <div className="h-12 w-12 rounded-full bg-gray-300" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-300 rounded w-1/4" />
              <div className="h-3 bg-gray-300 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (chats.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No chats yet</h3>
        <p className="text-gray-600">
          Start a chat by clicking on an item or request
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {chats.map((chat) => {
        const partner = getChatPartner(chat)
        return (
          <div key={chat.id} className="flex items-center gap-3 p-4 rounded-lg dark:hover:bg-white/10 transition-colors group">
            <a
              href={`/dashboard/chat/${chat.id}`}
              className="flex items-center gap-3 flex-1"
            >
              <Avatar>
                <AvatarImage src={partner?.avatar_url} alt={partner?.name} />
                <AvatarFallback>
                  {partner?.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-medium truncate">{partner?.name}</p>
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(chat.last_message_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-gray-600 truncate">
                  {getChatTitle(chat)}
                </p>
              </div>
              {chat.status === 'active' && (
                <Badge variant="default" className="h-2 w-2 p-0 rounded-full" />
              )}
            </a>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.preventDefault()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={(e) => {
                    e.preventDefault()
                    handleDeleteChat(chat)
                  }}
                  disabled={deleting === chat.id}
                >
                  {deleting === chat.id ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Chat
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      })}
    </div>
  )
}
