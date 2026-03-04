'use client'
 
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { MapPin, MessageSquare, IndianRupee, Eye, Calendar, Trash2, Loader2 } from 'lucide-react'
import { formatPrice, formatDate } from '@/lib/utils'
import { Item } from '@/types'
import { useRouter } from 'next/navigation'
import { notificationService } from '@/lib/notifications'
import { DeleteItemDialog } from './delete-item-dialog'

interface ItemCardProps {
  item: Item
  currentUser: {
    id: string
    hostel_type: 'boys' | 'girls'
  }
  onDelete?: (itemId: string) => void
}

export function ItemCard({ item, currentUser, onDelete }: ItemCardProps) {
  const supabase = createClient()
  const router = useRouter()
  // notificationService is now imported as a singleton
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
 
  const handleDeleteItem = async () => {
    if (item.seller_id !== currentUser.id) {
      toast.error("You can only delete your own items")
      return
    }

    setIsDeleting(true)
    
    try {
      // Delete associated chat rooms first (if any)
      const { error: chatError } = await supabase
        .from('chat_rooms')
        .delete()
        .eq('item_id', item.id)

      if (chatError) throw chatError

      // Delete the item
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', item.id)

      if (error) throw error

      toast.success('Item deleted successfully')
      
      // Call the onDelete callback to update parent component state
      if (onDelete) {
        onDelete(item.id)
      } else {
        // Fallback to router refresh if no callback provided
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to delete item:', error)
      toast.error('Failed to delete item')
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
    }
  }
  const [isStartingChat, setIsStartingChat] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleStartChat = async () => {
    if (item.seller_id === currentUser.id) {
      toast.error("You can't chat with yourself")
      return
    }

    // Get seller's hostel type to validate compatibility
    const { data: sellerProfile } = await supabase
      .from('profiles')
      .select('hostel_type')
      .eq('id', item.seller_id)
      .single()

    if (sellerProfile && sellerProfile.hostel_type !== currentUser.hostel_type) {
      toast.error("You can only communicate with users from your hostel")
      return
    }

    setIsStartingChat(true)
    
    try {
      // Check if chat room already exists
      const { data: existingChat } = await supabase
        .from('chat_rooms')
        .select('id')
        .eq('item_id', item.id)
        .eq('buyer_id', currentUser.id)
        .single()

      if (existingChat) {
        window.location.href = `/dashboard/chat/${existingChat.id}`
        return
      }

      // Create new chat room
      const { data: chatRoom, error } = await supabase
        .from('chat_rooms')
        .insert({
          item_id: item.id,
          buyer_id: currentUser.id,
          seller_id: item.seller_id,
          status: 'active',
          last_message_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error

      // Send notification to the seller
      await notificationService.createChatNotification(
        chatRoom.id,
        currentUser.id,
        item.seller_id,
        item.title
      )

      toast.success('Chat started! Seller has been notified.')
      window.location.href = `/dashboard/chat/${chatRoom.id}`
    } catch (error) {
      console.error('Failed to start chat:', error)
      toast.error('Failed to start chat')
    } finally {
      setIsStartingChat(false)
    }
  }

  const conditionColors = {
    new: 'bg-green-100 text-green-800',
    like_new: 'bg-blue-100 text-blue-800',
    good: 'bg-yellow-100 text-yellow-800',
    fair: 'bg-orange-100 text-orange-800',
  }

  const statusColors = {
    available: 'bg-green-100 text-green-800',
    reserved: 'bg-yellow-100 text-yellow-800',
  }

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
        <div className="relative h-58 w-38 mx-auto">
          {item.images && item.images[0] ? (
            <Image
              src={item.images[0]}
              alt={item.title}
              fill
              className="object-cover border rounded-sm"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            />
          ) : (
            <div className="h-full w-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500">No image</span>
            </div>
          )}
          <div className="absolute top-2 left-2 flex gap-2">
            <Badge className={`${conditionColors[item.condition as keyof typeof conditionColors]}`}>
              {item.condition.replace('_', ' ')}
            </Badge>
            <Badge className={statusColors[item.status as keyof typeof statusColors]}>
              {item.status}
            </Badge>
          </div>
        </div>
        
        <CardContent className="p-4 flex-1">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-lg line-clamp-1">{item.title}</h3>
            <div className="flex items-center font-bold text-lg">
              {formatPrice(item.price)}
            </div>
          </div>
          
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {item.description}
          </p>
          
          {item.seller && (
            <div className="flex items-center gap-3 mt-auto pt-4 border-t">
              <Avatar className="h-8 w-8">
                <AvatarImage src={item.seller.avatar_url} alt={item.seller.name} />
                <AvatarFallback>
                  {item.seller.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.seller.name}</p>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">
                    {item.seller.hostel_name}, Room {item.seller.room_number}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="p-4 pt-0 mt-auto">
          <div className="w-full flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 cursor-pointer"
              onClick={() => setIsDialogOpen(true)}
            >
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Button>
            
            {item.seller_id === currentUser.id ? (
              <Button
                variant="destructive"
                size="sm"
                className="flex-1 cursor-pointer"
                onClick={() => setIsDeleteDialogOpen(true)}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                className="flex-1 gap-2 cursor-pointer"
                onClick={handleStartChat}
                disabled={isStartingChat || item.status !== 'available'}
              >
                {isStartingChat ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MessageSquare className="h-4 w-4" />
                )}
                {item.status === 'available' ? 'I Want This' : 'Chat'}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>

      {/* Item Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl border dark:border-white/30">
          <DialogHeader>
            <DialogTitle>{item.title}</DialogTitle>
            <DialogDescription>
              Listed on {formatDate(item.created_at)}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="relative h-64 w-full rounded-lg overflow-hidden">
                {item.images && item.images[0] ? (
                  <Image
                    src={item.images[0]}
                    alt={item.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500">No image</span>
                  </div>
                )}
              </div>
              
              {item.images && item.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {item.images.slice(1).map((image, index) => (
                    <div key={index} className="relative h-20 w-20 flex-shrink-0 rounded overflow-hidden">
                      <Image
                        src={image}
                        alt={`${item.title} ${index + 2}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <p className="text-gray-700 dark:text-white/50">{item.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-white">Price</p>
                  <p className="text-2xl font-bold flex items-center dark:text-white/50">
                    {formatPrice(item.price)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-white">Condition</p>
                  <Badge className={conditionColors[item.condition as keyof typeof conditionColors]}>
                    {item.condition.replace('_', ' ')}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-white">Category</p>
                  <p className="font-medium dark:text-white/50">{item.category}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-white">Status</p>
                  <Badge className={statusColors[item.status as keyof typeof statusColors]}>
                    {item.status}
                  </Badge>
                </div>
              </div>
              
              {item.seller && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-3">Seller Information</h3>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={item.seller.avatar_url} alt={item.seller.name} />
                      <AvatarFallback>
                        {item.seller.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{item.seller.name}</p>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <MapPin className="h-3 w-3 dark:text-white/50" />
                        <span className='dark:text-white/50'>{item.seller.hostel_name}, Room {item.seller.room_number}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Close
            </Button>
            <Button
              onClick={handleStartChat}
              disabled={item.seller_id === currentUser.id || item.status !== 'available'}
              className="gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              Start Chat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteItemDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteItem}
        itemName={item.title}
      />
    </>
  )
}