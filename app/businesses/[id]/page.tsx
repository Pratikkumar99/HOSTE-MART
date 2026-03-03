"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { DashboardHeader } from "@/components/dashboard/sidebar"
import { User } from "@/types"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Store, MapPin, Phone, Mail, ArrowLeft, Package, Edit, Trash2 } from "lucide-react"
import Link from "next/link"
import { Business, Item } from "@/types"
import { toast } from "sonner"

export default function BusinessDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [business, setBusiness] = useState<Business | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [profile, setProfile] = useState<User | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        if (data) setProfile(data)
      }
    }
    fetchProfile()
  }, [])

  useEffect(() => {
    if (params.id) {
      fetchBusinessData()
    }
  }, [params.id])

  const fetchBusinessData = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)

      // Fetch business
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', params.id)
        .eq('status', 'active')
        .single()

      if (businessError || !businessData) {
        router.push('/businesses')
        return
      }

      setBusiness(businessData)

      // Fetch business owner profile
      const { data: ownerProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', businessData.owner_id)
        .single()

      setProfile(ownerProfile || null)

      // Fetch business items
      const { data: itemsData, error: itemsError } = await supabase
        .from('items')
        .select('*')
        .eq('business_id', params.id) // Use business_id since it exists
        .eq('status', 'available')
        .order('created_at', { ascending: false })

      if (itemsError) throw itemsError
      setItems(itemsData || [])
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to load business data')
    } finally {
      setLoading(false)
    }
  }

  const handleContact = () => {
    // Contact through profile phone number instead
    if (profile?.phone_number) {
      window.open(`tel:${profile.phone_number}`, '_blank')
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return

    try {
      if (!currentUser) throw new Error("Not authenticated")

      // Get item to delete images
      const { data: itemData } = await supabase
        .from('items')
        .select('images')
        .eq('id', itemId)
        .eq('seller_id', currentUser.id)
        .single()

      // Delete images from storage
      if (itemData?.images) {
        for (const imageUrl of itemData.images) {
          const fileName = imageUrl.split('/').pop()
          if (fileName) {
            await supabase.storage
              .from('item-images')
              .remove([fileName])
          }
        }
      }

      // Delete item
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', itemId)
        .eq('seller_id', currentUser.id)

      if (error) throw error

      toast.success("Item deleted successfully!")
      setItems(items.filter(item => item.id !== itemId))
    } catch (error) {
      console.error("Error deleting item:", error)
      toast.error("Failed to delete item")
    }
  }

  const isOwner = currentUser && business && currentUser.id === business.owner_id

  const handleWantItem = async (item: Item) => {
    try {
      if (!currentUser) {
        toast.error("Please login to request items")
        router.push('/login')
        return
      }

      // Check if chat room already exists
      const { data: existingChat } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('item_id', item.id)
        .eq('buyer_id', currentUser.id)
        .eq('seller_id', item.seller_id)
        .single()

      if (existingChat) {
        toast.success("Chat already exists! Redirecting to chat...")
        router.push(`/dashboard/chat/${existingChat.id}`)
        return
      }

      // Create new chat room
      const { data: chatRoom, error: chatError } = await supabase
        .from('chat_rooms')
        .insert({
          item_id: item.id,
          buyer_id: currentUser.id,
          seller_id: item.seller_id,
          status: 'active',
          last_message_at: new Date().toISOString()
        })
        .select()
        .single()

      if (chatError) throw chatError

      // Send initial message
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          chat_room_id: chatRoom.id,
          sender_id: currentUser.id,
          content: `Hi! I'm interested in your item: ${item.title}`,
          is_system_message: false
        })

      if (messageError) throw messageError

      toast.success("Chat started! You can now message the seller.")
      router.push(`/dashboard/chat/${chatRoom.id}`)
    } catch (error) {
      console.error("Error requesting item:", error)
      toast.error("Failed to start chat")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black py-8">
        {profile && <DashboardHeader profile={profile} />}
        <div className="max-w-6xl mx-auto px-4">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (!business) return null

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Link href="/businesses" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 mb-6  py-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Businesses
        </Link>
      <div className="max-w-6xl mx-auto px-4">
        {/* Back Link */}
        

        {/* Business Header */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Logo */}
              <div className="w-24 h-24 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                {business.logo_url ? (
                  <img
                    src={business.logo_url}
                    alt={business.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Store className="w-12 h-12 m-6 text-gray-400" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h1 className="text-2xl font-bold">{business.name}</h1>
                  <Badge variant="outline">{business.category}</Badge>
                </div>
                
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {business.description}
                </p>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                    <p className="text-md text-gray-600 dark:text-gray-400">Location</p>
                    <p className="font-medium dark:text-white">{business.location}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Items for Sale ({items.length})
          </h2>

          {items.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-lg">
              <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No items available from this business</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item) => (
                <Card key={item.id} className="h-full hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    {/* Item Images */}
                    <div className="aspect-square rounded-lg bg-gray-100 overflow-hidden mb-4">
                      {item.images && item.images.length > 0 ? (
                        <img
                          src={item.images[0]}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Item Info */}
                    <h3 className="font-semibold text-lg truncate">{item.title}</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2 mt-1">
                      {item.description}
                    </p>
                    
                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                      <span className="font-bold text-lg">Rs. {item.price}</span>
                      <Badge variant={item.condition === 'new' ? 'default' : 'secondary'}>
                        {item.condition}
                      </Badge>
                    </div>

                    {/* Owner Actions */}
                    {isOwner ? (
                      <div className="flex gap-2 mt-3">
                        <Link href={`/business/items/${item.id}/edit`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full cursor-pointer">
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                        </Link>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => handleDeleteItem(item.id)}
                          className="px-3 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="mt-3">
                        <Button 
                          variant="default" 
                          size="sm" 
                          className="w-full"
                          onClick={() => handleWantItem(item)}
                        >
                          I Want This
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
