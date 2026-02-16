'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Search, Home, Package, ShoppingCart, LogOut, User, MessageSquare } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { User as UserType } from '@/types'
import { createClient } from '@/lib/supabase/client'

interface HeaderProps {
  profile: UserType
}

export function DashboardHeader({ profile }: HeaderProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/dashboard/items?search=${encodeURIComponent(searchQuery)}`)
    }
  }

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-sm border-b border-gray-200">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Search */}
          <div className="flex-1 max-w-2xl">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="search"
                placeholder="Search items, requests, or users..."
                className="pl-10 pr-4 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center space-x-4">
            {/* Quick Actions */}
            <div className="hidden md:flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className="hidden lg:flex cursor-pointer"
                onClick={() => router.push('/dashboard/items/new')}
              >
                <Package className="mr-2 h-4 w-4" />
                Sell Item
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="hidden lg:flex cursor-pointer"
                onClick={() => router.push('/dashboard/requests/new')}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Make Request
              </Button>
            </div>

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative cursor-pointer">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-white" />
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile.avatar_url} alt={profile.name} />
                    <AvatarFallback>
                      {profile.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{profile.name}</p>
                    <p className="text-xs leading-none text-gray-500">
                      {profile.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/dashboard/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/dashboard/items')}>
                  <Package className="mr-2 h-4 w-4" />
                  My Items
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-gray-500">
                  Hostel: {profile.hostel_name}
                </DropdownMenuLabel>
                <DropdownMenuItem className="text-xs">
                  Room: {profile.room_number}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-red-600" 
                  onClick={async () => {
                    const supabase = createClient()
                    await supabase.auth.signOut()
                    router.push('/login')
                    router.refresh()
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile quick actions */}
        <div className="md:hidden flex items-center justify-between py-3 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 cursor-pointer"
            onClick={() => router.push('/dashboard/items/new')}
          >
            <Package className="mr-2 h-4 w-4" />
            Sell
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 cursor-pointer"
            onClick={() => router.push('/dashboard/requests/new')}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Request
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 cursor-pointer"
            onClick={() => router.push('/dashboard/chat')}
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Chat
          </Button>
        </div>
      </div>
    </header>
  )
}