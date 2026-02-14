// lib/notifications.ts
import { createClient } from '@/lib/supabase/client'

class NotificationService {
  private supabase = createClient()

async createChatNotification(chatRoomId: string, buyerId: string, sellerId: string, itemTitle?: string, requestTitle?: string) {
  console.log('createChatNotification called with:', { chatRoomId, buyerId, sellerId, itemTitle, requestTitle });
  
  try {
    const title = itemTitle ? `🛍️ New inquiry about "${itemTitle}"` : `📋 New inquiry about "${requestTitle}"`;
    const message = itemTitle 
      ? `Someone is interested in buying your item "${itemTitle}". Start chatting to discuss the details.`
      : `Someone wants to help with your request "${requestTitle}". Start chatting to coordinate.`;

    console.log('Creating notification with:', { 
      sellerId, 
      title, 
      message,
      type: 'chat',
      link_url: `/dashboard/chat/${chatRoomId}`
    });
    
    const { data, error } = await this.supabase
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
      .select()
      .single();

    if (error) {
      console.error('Supabase error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      return false;
    }

    console.log('Notification created successfully:', data);
    return true;
  } catch (error) {
    console.error('Unexpected error in createChatNotification:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return false;
  }
}
async createMessageNotification(chatRoomId: string, senderId: string, receiverId: string, messageContent: string) {
  try {
    console.log('createMessageNotification called with:', { chatRoomId, senderId, receiverId, messageContent });
    
    // Don't create notification for system messages or if sender is the same as receiver
    if (messageContent.includes('System:') || senderId === receiverId) {
      console.log('Skipping notification - system message or sender is receiver');
      return false;
    }

    const title = '💬 New message';
    const message = `You have a new message: ${messageContent.substring(0, 50)}${messageContent.length > 50 ? '...' : ''}`;

    console.log('Inserting notification into database...');
    
    const { data, error } = await this.supabase
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
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return false;
    }

    console.log('Notification created successfully:', data);
    return true;
  } catch (error) {
    console.error('Error in createMessageNotification:', error);
    return false;
  }
}
}

// Export a single instance of the NotificationService
export const notificationService = new NotificationService()
