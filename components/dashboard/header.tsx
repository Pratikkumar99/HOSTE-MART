'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User } from '@/types'
import { LogOut, Bell, Search, Menu, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { NotificationBell } from '@/components/notifications/notification-bell'

interface HeaderProps {
  profile: User
}

export function DashboardHeader({ profile }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()
  const pathname = usePathname()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/dashboard/items?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  // Only show search bar on the main dashboard page
  const showSearch = pathname === '/dashboard'

  const handleLogout = async () => {
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signOut()
      
      if (error) throw error
      
      // Clear any cached data
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
      }
      
      // Force a full page reload to clear all state
      window.location.href = '/login'
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="" className="h-10 w-10" />
          <span className="font-bold text-lg hidden sm:block">HostelMart</span>
        </div>
        {showSearch && (
          <form onSubmit={handleSearch} className="relative w-64 ml-6">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground ml" />
            <Input
              type="search"
              placeholder="Search items..."
              className="w-full pl-8 pr-20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button 
              type="submit" 
              size="sm" 
              className="absolute right-1 top-1 h-7 px-2 text-xs"
            >
              Search
            </Button>
          </form>
        )}
      </div>
      
      <div className="flex items-center gap-4">
        <NotificationBell />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8rounded-full">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                {profile.name?.[0]?.toUpperCase() || 'U'}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {profile.name || 'User'}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {profile.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/dashboard/profile')}>
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/dashboard/requests')}>
              Request Item
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/dashboard/items')}>
              Sell Item
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/dashboard/chat')}>
              My Chats
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-destructive focus:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}