// components/chat/chat-list.tsx

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
import { MessageSquare, Trash2, MoreHorizontal } from 'lucide-react'
import { ChatRoom } from '@/types'
import { DeleteChatDialog } from './delete-chat-dialog'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

interface ChatListProps {
  userId: string
}

export function ChatList({ userId }: ChatListProps) {
  const supabase = createClient()

  const [chats, setChats] = useState<ChatRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedChat, setSelectedChat] = useState<ChatRoom | null>(null)

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

  const handleDeleteChat = async (chat: ChatRoom) => {
    try {
      console.log('Deleting chat:', chat.id)
      
      const { error } = await supabase
        .from('chat_rooms')
        .delete()
        .eq('id', chat.id)

      if (error) {
        console.error('Delete error:', error)
        throw error
      }

      console.log('Chat deleted successfully')
      toast.success('Chat deleted successfully')
      
      // Update local state immediately
      setChats(prevChats => {
        const updated = prevChats.filter(c => c.id !== chat.id)
        console.log('Updated chats:', updated.length, 'from', prevChats.length)
        return updated
      })
      
      // Force a reload after a short delay to ensure database consistency
      setTimeout(() => {
        loadChats()
      }, 1000)
      
    } catch (error) {
      console.error('Error deleting chat:', error)
      toast.error('Failed to delete chat')
    }
  }

  const openDeleteDialog = (chat: ChatRoom, e: React.MouseEvent) => {
    e.preventDefault()
    setSelectedChat(chat)
    setDeleteDialogOpen(true)
  }

  return (
    <>
      <div className="space-y-2">
        {chats.map((chat) => {
          const partner = getChatPartner(chat)
          return (
            <div key={chat.id} className="flex items-center gap-3 p-4 rounded-lg hover:bg-gray-50 transition-colors group">
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
                    onClick={(e) => openDeleteDialog(chat, e)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Chat
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        })}
      </div>

      <DeleteChatDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={async () => {
          if (selectedChat) {
            await handleDeleteChat(selectedChat)
          }
        }}
        chatTitle={selectedChat ? getChatTitle(selectedChat) : ''}
      />
    </>
  )
}