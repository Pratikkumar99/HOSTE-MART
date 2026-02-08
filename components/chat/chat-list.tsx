// components/chat/chat-list.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
import { MessageSquare } from 'lucide-react'
import { ChatRoom } from '@/types'

interface ChatListProps {
  userId: string
}

export function ChatList({ userId }: ChatListProps) {
  const supabase = createClient()
  const [chats, setChats] = useState<ChatRoom[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadChats()
    subscribeToChats()
  }, [userId])

  const loadChats = async () => {
    const { data } = await supabase
      .from('chat_rooms')
      .select(`
        *,
        item:items(title, price),
        request:requests(title),
        buyer:profiles!chat_rooms_buyer_id_fkey(name, avatar_url),
        seller:profiles!chat_rooms_seller_id_fkey(name, avatar_url)
      `)
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .order('last_message_at', { ascending: false })

    if (data) {
      setChats(data as ChatRoom[])
    }
    setLoading(false)
  }

  const subscribeToChats = () => {
    const channel = supabase
      .channel('chat_rooms')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_rooms',
        },
        () => {
          loadChats()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
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
          <a
            key={chat.id}
            href={`/dashboard/chat/${chat.id}`}
            className="flex items-center gap-3 p-4 rounded-lg hover:bg-gray-50 transition-colors"
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
        )
      })}
    </div>
  )
}