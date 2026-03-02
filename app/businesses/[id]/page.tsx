"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { DashboardHeader } from "@/components/dashboard/sidebar"
import { User } from "@/types"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Store, MapPin, Phone, Mail, ArrowLeft, Package } from "lucide-react"
import Link from "next/link"
import { Business, Item } from "@/types"
import { toast } from "sonner"

export default function BusinessDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [business, setBusiness] = useState<Business | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [profile, setProfile] = useState<User | null>(null)
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

      // Fetch business items
      const { data: itemsData, error: itemsError } = await supabase
        .from('items')
        .select('*')
        .eq('business_id', params.id)
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
    if (business?.phone_number) {
      window.open(`tel:${business.phone_number}`, '_blank')
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
    <div className="min-h-screen bg-gray-50 dark:bg-black">
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

                <div className="flex flex-wrap gap-4 text-sm">
                  <span className="flex items-center gap-1 text-gray-500">
                    <MapPin className="w-4 h-4" />
                    {business.location}
                  </span>
                  <span className="flex items-center gap-1 text-gray-500">
                    <Phone className="w-4 h-4" />
                    {business.phone_number}
                  </span>
                  <span className="flex items-center gap-1 text-gray-500">
                    <Mail className="w-4 h-4" />
                    {business.email}
                  </span>
                </div>

                <div className="mt-4 pt-4 border-t flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    Serves: {business.hostel_type === 'both' ? 'Both Hostels' : 
                            business.hostel_type === 'boys' ? 'Boys Hostel' : 'Girls Hostel'}
                  </span>
                  <Button onClick={handleContact} size="sm">
                    Contact Business
                  </Button>
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
                <Link key={item.id} href={`/items/${item.id}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
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

                      <p className="text-xs text-gray-500 mt-2">
                        Visible to: {item.hostel_visible_to === 'both' ? 'Both Hostels' : 
                                   item.hostel_visible_to === 'boys' ? 'Boys' : 'Girls'}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
