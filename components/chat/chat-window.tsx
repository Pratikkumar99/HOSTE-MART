// components/chat/chat-window.tsx
'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Send, Check, CheckCheck, MapPin } from 'lucide-react'
import { format } from 'date-fns'
import { Message } from '@/types'
import { toast } from 'sonner'
import { notificationService } from '@/lib/notifications'

interface ChatWindowProps {
  chatRoomId: string
  currentUserId: string
}

interface ChatRoomUserLite {
  id: string
  name: string
  avatar_url: string | null
  hostel_name: string
  room_number: string
}

interface ChatRoomWithUsers {
  buyer: ChatRoomUserLite
  seller: ChatRoomUserLite
}

export function ChatWindow({ chatRoomId, currentUserId }: ChatWindowProps) {
  const supabase = createClient()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')

  const [isSending, setIsSending] = useState(false)
  const [otherUser, setOtherUser] = useState<{
    name: string
    avatar_url: string | null
    hostel_name: string
    room_number: string
  } | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadMessages()
    loadOtherUser()
    const cleanup = subscribeToMessages()
    return cleanup
  }, [chatRoomId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadMessages = async () => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles(name, avatar_url)
      `)
      .eq('chat_room_id', chatRoomId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error loading messages:', error)
      toast.error('Failed to load messages')
      return
    }

    if (data) {
      setMessages(data as Message[])
    }
  } catch (error) {
    console.error('Unexpected error loading messages:', error)
    toast.error('An unexpected error occurred')
  }

  // Mark all messages as read
  await supabase
    .from('messages')
    .update({ read: true })
    .eq('chat_room_id', chatRoomId)
    .neq('sender_id', currentUserId)
    .eq('read', false)
}

  const loadOtherUser = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_rooms')
        .select(`
          buyer:profiles!chat_rooms_buyer_id_fkey(id, name, avatar_url, hostel_name, room_number),
          seller:profiles!chat_rooms_seller_id_fkey(id, name, avatar_url, hostel_name, room_number)
        `)
        .eq('id', chatRoomId)
        .single()

      if (error) {
        console.error('Error loading chat room:', error)
        toast.error('Failed to load chat room')
        return
      }

      if (data) {
        const chatRoom = data as unknown as ChatRoomWithUsers
        const other = currentUserId === chatRoom.buyer.id ? chatRoom.seller : chatRoom.buyer
        setOtherUser(other)
      }
    } catch (error) {
      console.error('Unexpected error loading chat room:', error)
      toast.error('An unexpected error occurred')
    }
  }

  const subscribeToMessages = () => {
  const channel = supabase
    .channel(`chat:${chatRoomId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `chat_room_id=eq.${chatRoomId}`,
      },
      async (payload) => {
        const newMessage = payload.new as Message
        setMessages((prev) => [...prev, newMessage])
        
        // If this is a message from the other user, mark it as read
        if (newMessage.sender_id !== currentUserId) {
          await supabase
            .from('messages')
            .update({ read: true })
            .eq('id', newMessage.id)
        }
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

  const handleSendMessage = async () => {
  if (!newMessage.trim()) return;
  setIsSending(true);
  
  try {
    // Get chat room details to find the other user
    const { data: chatRoom, error: chatRoomError } = await supabase
      .from('chat_rooms')
      .select('buyer_id, seller_id')
      .eq('id', chatRoomId)
      .single();

    if (chatRoomError || !chatRoom) {
      throw new Error(chatRoomError?.message || 'Chat room not found');
    }

    const receiverId = chatRoom.buyer_id === currentUserId 
      ? chatRoom.seller_id 
      : chatRoom.buyer_id;

    // Debug log
    console.log('Sending message to receiver:', receiverId);

    // Send the message
    const { error } = await supabase
      .from('messages')
      .insert({
        chat_room_id: chatRoomId,
        sender_id: currentUserId,
        content: newMessage.trim(),
      });

    if (error) throw error;

    // Clear the input field immediately for better UX
    setNewMessage('');

    // Debug log before creating notification
    console.log('Creating notification for message...');

    // Create notification for the receiver
    const notificationResult = await notificationService.createMessageNotification(
      chatRoomId,
      currentUserId,
      receiverId,
      newMessage.trim()
    );

    // Debug log the notification result
    console.log('Notification creation result:', notificationResult);

    // Reload messages to ensure we have the latest data
    await loadMessages();
    
    // Update last message time
    await supabase
      .from('chat_rooms')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', chatRoomId);
    setNewMessage('');
  } catch (error) {
    console.error('Failed to send message:', error);
    toast.error('Failed to send message');
  } finally {
    setIsSending(false);
  }
};

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="flex flex-col h-[calc(100vh-200px)]">
      {/* Chat Header */}
      {otherUser && (
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={otherUser.avatar_url || ''} />
                  <AvatarFallback>{otherUser.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{otherUser.name}</h3>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <MapPin className="h-3 w-3" />
                    <span>{otherUser.hostel_name}, Room {otherUser.room_number}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender_id === currentUserId
                ? 'justify-end'
                : message.is_system_message
                  ? 'justify-center'
                  : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                message.sender_id === currentUserId
                  ? 'bg-primary text-primary-foreground'
                  : message.is_system_message
                    ? 'bg-gray-100 text-gray-600 text-sm italic'
                    : 'bg-muted'
              }`}
            >
              {!message.is_system_message && (
                <div className="flex items-center gap-2 mb-1">
                  {message.sender_id !== currentUserId && (
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={message.sender?.avatar_url || ''} />
                      <AvatarFallback>
                        {message.sender?.name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <span className="text-xs opacity-80">
                    {format(new Date(message.created_at), 'HH:mm')}
                  </span>
                </div>
              )}
              <p className="whitespace-pre-wrap">{message.content}</p>
              {message.sender_id === currentUserId && !message.is_system_message && (
                <div className="flex justify-end mt-1">
                  {message.read ? (
                    <CheckCheck className="h-3 w-3" />
                  ) : (
                    <Check className="h-3 w-3" />
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type your message..."
            disabled={isSending}
          />
          <Button
            onClick={handleSendMessage}
            disabled={isSending || !newMessage.trim()}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}