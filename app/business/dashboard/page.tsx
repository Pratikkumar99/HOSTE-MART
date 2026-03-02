"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { DashboardHeader } from "@/components/dashboard/sidebar"
import { User } from "@/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { Store, Package, Plus, TrendingUp, Users, ArrowLeft, Edit } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Business, Item } from "@/types"

export default function BusinessDashboardPage() {
  const [business, setBusiness] = useState<Business | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [profile, setProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchBusinessData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }

        // Fetch profile
        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        if (profileData) setProfile(profileData)

        // Fetch business
        const { data: businessData, error: businessError } = await supabase
          .from('businesses')
          .select('*')
          .eq('owner_id', user.id)
          .single()

        if (businessError || !businessData) {
          router.push('/business/setup')
          return
        }

        setBusiness(businessData)

        // Fetch business items
        const { data: itemsData } = await supabase
          .from('items')
          .select('*')
          .eq('business_id', businessData.id)
          .order('created_at', { ascending: false })

        setItems(itemsData || [])
      } catch (error) {
        console.error("Error:", error)
        toast.error("Failed to load business data")
      } finally {
        setLoading(false)
      }
    }

    fetchBusinessData()
  }, [])

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      available: "bg-green-100 text-green-800",
      reserved: "bg-yellow-100 text-yellow-800",
      sold: "bg-gray-100 text-gray-800",
    }
    return colors[status] || "bg-gray-100 text-gray-800"
  }

  if (loading) return <div className="p-8">Loading...</div>
  if (!business) return null

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <Link
        href="/dashboard"
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6 my-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Link>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Business Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className="w-20 h-20 rounded-lg bg-gray-100 overflow-hidden">
                  {business.logo_url ? (
                    <img src={business.logo_url} alt={business.name} width={80} height={80} className="object-cover w-full h-full" />
                  ) : (
                    <Store className="w-10 h-10 m-5 text-gray-400" />
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{business.name}</h1>
                  <p className="text-gray-600">{business.description}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline">{business.category}</Badge>
                    <Badge className={business.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {business.status}
                    </Badge>
                  </div>
                </div>
              </div>
              <Link href="/business/edit">
                <Button variant="outline">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Package className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{items.length}</p>
                  <p className="text-sm text-gray-600">Total Items</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{items.filter(i => i.status === 'available').length}</p>
                  <p className="text-sm text-gray-600">Available</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{items.filter(i => i.status === 'reserved').length}</p>
                  <p className="text-sm text-gray-600">Reserved</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="items">
          <TabsList>
            <TabsTrigger value="items">Items</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="items" className="mt-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Your Items</h2>
              <Link href="/business/items/create">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {items.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="aspect-video bg-gray-100 rounded-lg mb-3 overflow-hidden">
                      {item.images?.[0] ? (
                        <Image src={item.images[0]} alt={item.title} width={300} height={200} className="object-cover w-full h-full" />
                      ) : (
                        <Package className="w-12 h-12 m-auto text-gray-400" />
                      )}
                    </div>
                    <h3 className="font-semibold truncate">{item.title}</h3>
                    <p className="text-lg font-bold text-primary">Rs.{item.price}</p>
                    <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                    <div className="flex gap-2 mt-3">
                      <Link href={`/business/items/${item.id}/edit`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">Edit</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Business Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium">{business.phone_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{business.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Location</p>
                    <p className="font-medium">{business.location}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Serves</p>
                    <p className="font-medium capitalize">{business.hostel_type} Hostel</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
