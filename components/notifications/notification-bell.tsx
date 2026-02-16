'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Check, AlertCircle, AlertTriangle, Info, X, RefreshCw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { User } from '@supabase/supabase-js';

type NotificationType = 'info' | 'success' | 'warning' | 'error';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  created_at: string;
  user_id?: string;
  link_url?: string;
}

interface NotificationBellProps {
  user: User | null;
}

export function NotificationBell({ user }: NotificationBellProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await createClient()
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.read).length || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = createClient()
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          if (!newNotification.read) {
            setUnreadCount(prev => prev + 1);
            // Play a subtle sound for new notifications
            if (typeof window !== 'undefined' && 'Audio' in window) {
              const audio = new Audio('/notification.mp3');
              audio.play().catch(console.error);
            }
          }
        }
      )
      .subscribe();

    return () => {
      createClient().removeChannel(channel);
    };
  }, [user?.id]);

  const markAsRead = async (id: string) => {
    try {
      const { error } = await createClient()
        .from('notifications')
        .update({ read: true })
        .eq('id', id);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;

    try {
      const { error } = await createClient()
        .from('notifications')
        .update({ read: true })
        .in('id', unreadIds);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => (n.read ? n : { ...n, read: true }))
      );
      setUnreadCount(0);
      toast.success('Marked all as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const clearAll = async () => {
    if (!user?.id) return;

    try {
      const { error } = await createClient()
        .from('notifications')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setNotifications([]);
      setUnreadCount(0);
      toast.success('Cleared all notifications');
    } catch (error) {
      console.error('Error clearing notifications:', error);
      toast.error('Failed to clear notifications');
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    const iconProps = { className: 'h-4 w-4' };
    switch (type) {
      case 'success': return <Check {...iconProps} className={`${iconProps.className} text-green-500`} />;
      case 'warning': return <AlertTriangle {...iconProps} className={`${iconProps.className} text-yellow-500`} />;
      case 'error': return <X {...iconProps} className={`${iconProps.className} text-red-500`} />;
      default: return <Info {...iconProps} className={`${iconProps.className} text-blue-500`} />;
    }
  };

  return (
    <DropdownMenu onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-accent hover:text-accent-foreground cursor-pointer"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -right-1 -top-1 h-5 w-5 items-center justify-center rounded-full p-0"
              variant="destructive"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end" forceMount>
        <div className="flex items-center justify-between p-2">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">Notifications</h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                fetchNotifications();
              }}
              disabled={isLoading}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <div className="flex gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  markAllAsRead();
                }}
              >
                Mark all read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  clearAll();
                }}
              >
                Clear all
              </Button>
            )}
          </div>
        </div>
        <DropdownMenuSeparator />
        
        {isLoading ? (
          <div className="flex justify-center p-4">
            <RefreshCw className="h-5 w-5 animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            No notifications yet
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex items-start gap-3 p-3 ${!notification.read ? 'bg-accent' : ''} cursor-pointer`}
                onClick={(e) => {
                  e.preventDefault();
                  markAsRead(notification.id);
                  if (notification.link_url) {
                    router.push(notification.link_url);
                  }
                }}
              >
                <div className="mt-0.5 flex-shrink-0">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="truncate text-sm font-medium leading-none">
                    {notification.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(notification.created_at).toLocaleString()}
                  </p>
                </div>
                {!notification.read && (
                  <span className="ml-2 h-2 w-2 rounded-full bg-primary" />
                )}
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}