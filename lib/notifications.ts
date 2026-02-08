// lib/notifications.ts
import { createClient } from '@/lib/supabase/client'

export class NotificationService {
  private supabase = createClient()

  async createChatNotification(chatRoomId: string, buyerId: string, sellerId: string, itemTitle?: string, requestTitle?: string) {
    const title = itemTitle ? `🛍️ New inquiry about "${itemTitle}"` : `📋 New inquiry about "${requestTitle}"`
    const message = itemTitle 
      ? `Someone is interested in buying your item "${itemTitle}". Start chatting to discuss the details.`
      : `Someone wants to help with your request "${requestTitle}". Start chatting to coordinate.`

    // Create notification for the seller/requester
    const { error } = await this.supabase
      .from('notifications')
      .insert({
        user_id: sellerId,
        title,
        message,
        type: 'chat',
        link_url: `/dashboard/chat/${chatRoomId}`,
        read: false,
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('Failed to create chat notification:', error)
    }

    return !error
  }

  async createMessageNotification(chatRoomId: string, senderId: string, receiverId: string, messageContent: string) {
    // Don't create notification for system messages
    if (messageContent.includes('System:')) return

    const title = '💬 New message'
    const message = `You have a new message: ${messageContent.substring(0, 50)}${messageContent.length > 50 ? '...' : ''}`

    const { error } = await this.supabase
      .from('notifications')
      .insert({
        user_id: receiverId,
        title,
        message,
        type: 'chat',
        link_url: `/dashboard/chat/${chatRoomId}`,
        read: false,
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('Failed to create message notification:', error)
    }

    return !error
  }
}
