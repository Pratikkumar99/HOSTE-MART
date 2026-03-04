"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { DashboardHeader } from "@/components/dashboard/sidebar"
import { User } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, Store, MapPin, Phone, ArrowLeft, Users } from "lucide-react"
import Link from "next/link"
import { Business } from "@/types"
import Image from "next/image"

export default function BusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [profile, setProfile] = useState<User | null>(null)
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
    fetchBusinesses()
  }, [profile])

  const fetchBusinesses = async () => {
    try {
      let query = supabase
        .from('businesses')
        .select('*')
        .eq('status', 'active')

      // Filter by hostel type if user profile is available
      if (profile && profile.hostel_type) {
        query = query.eq('hostel_type', profile.hostel_type)
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })

      if (error) throw error
      setBusinesses(data || [])
    } catch (error) {
      console.error('Error fetching businesses:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredBusinesses = businesses.filter(business =>
    business.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    business.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    business.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black py-8">
        {profile && <DashboardHeader profile={profile} />}
        <div className="max-w-6xl mx-auto px-4">
          <p>Loading businesses...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen dark:bg-black">
      <Link href="/dashboard" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 py-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
        </Link>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold">Browse Businesses</h1>
          </div>
          <Link href="/business/setup">
            <Button className="cursor-pointer">
              <Store className="w-4 h-4 mr-2" />
              Add Your Business
            </Button>
          </Link>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="search"
            placeholder="Search businesses by name, category..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Businesses Grid */}
        {filteredBusinesses.length === 0 ? (
          <div className="text-center py-12">
            <Store className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No businesses found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBusinesses.map((business) => (
              <Link key={business.id} href={`/businesses/${business.id}`}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                        {business.logo_url ? (
                          <img
                            src={business.logo_url}
                            alt={business.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Store className="w-8 h-8 m-4 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg truncate">{business.name}</h3>
                        <Badge variant="outline" className="mt-1">{business.category}</Badge>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-300 text-sm mt-3 line-clamp-2">
                      {business.description}
                    </p>
                    
                    <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {business.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {business.hostel_type === 'boys' ? 'Boys' : 'Girls'}
                      </span>
                    </div>
                    
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
