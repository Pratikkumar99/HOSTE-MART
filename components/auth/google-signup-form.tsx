'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { User, Loader2 } from 'lucide-react'

interface GoogleSignupFormProps {
  user: {
    id: string
    email: string
    name: string
    avatar_url: string
  }
}

export function GoogleSignupForm({ user }: GoogleSignupFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [hostelType, setHostelType] = useState<'boys' | 'girls' | ''>('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string || user.name
    const rollNumber = formData.get('rollNumber') as string
    const hostelName = formData.get('hostelName') as string
    const roomNumber = formData.get('roomNumber') as string
    const phoneNumber = formData.get('phoneNumber') as string

    try {
      // Create user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          name,
          roll_number: rollNumber,
          hostel_type: hostelType,
          hostel_name: hostelName,
          room_number: roomNumber,
          phone_number: phoneNumber,
          avatar_url: user.avatar_url,
          auth_provider: 'google',
          email_verified: true, // Google users are automatically verified
        })

      if (profileError) {
        console.error('Profile creation error:', profileError)
        throw profileError
      }

      toast.success('Profile created successfully!')
      router.push('/dashboard')
      router.refresh()
    } catch (error) {
      console.error('Error creating profile:', error)
      toast.error('Failed to create profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* User Info from Google */}
      <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-black rounded-lg">
        <Avatar className="h-16 w-16">
          {user.avatar_url ? (
            <AvatarImage src={user.avatar_url} alt="Profile" className="object-cover" />
          ) : (
            <AvatarFallback className="bg-gray-100 dark:bg-black">
              <User className="h-8 w-8 text-gray-400" />
            </AvatarFallback>
          )}
        </Avatar>
        <div className="flex-1">
          <p className="text-sm text-gray-500 dark:text-gray-400">Signed in as</p>
          <p className="font-medium text-gray-900 dark:text-white">{user.email}</p>
        </div>
      </div>

      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input 
          id="name" 
          name="name" 
          placeholder="Enter your full name" 
          defaultValue={user.name}
          required 
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="rollNumber">Roll Number</Label>
          <Input id="rollNumber" name="rollNumber" placeholder="2023CS101" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="roomNumber">Room Number</Label>
          <Input id="roomNumber" name="roomNumber" placeholder="A-101" required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="hostelType">Hostel Type</Label>
          <Select name="hostelType" required value={hostelType} onValueChange={(value: 'boys' | 'girls') => setHostelType(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="boys">Boys Hostel</SelectItem>
              <SelectItem value="girls">Girls Hostel</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="hostelName">Hostel Name</Label>
          <Select name="hostelName" required disabled={!hostelType}>
            <SelectTrigger>
              <SelectValue placeholder={hostelType ? "Select hostel" : "Select hostel type first"} />
            </SelectTrigger>
            <SelectContent>
              {hostelType === 'boys' && (
                <>
                  <SelectItem value="BH-1">Boys Hostel 1 (BH-1)</SelectItem>
                  <SelectItem value="BH-2">Boys Hostel 2 (BH-2)</SelectItem>
                  <SelectItem value="BH-3">Boys Hostel 3 (BH-3)</SelectItem>
                  <SelectItem value="BH-4">Boys Hostel 4 (BH-4)</SelectItem>
                </>
              )}
              {hostelType === 'girls' && (
                <>
                  <SelectItem value="GH-1">Girls Hostel 1 (GH-1)</SelectItem>
                  <SelectItem value="GH-2">Girls Hostel 2 (GH-2)</SelectItem>
                  <SelectItem value="GH-3">Girls Hostel 3 (GH-3)</SelectItem>
                  <SelectItem value="GH-4">Girls Hostel 4 (GH-4)</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phoneNumber">Phone Number</Label>
        <Input id="phoneNumber" name="phoneNumber" placeholder="+91 9876543210" />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating Profile...
          </>
        ) : (
          'Complete Registration'
        )}
      </Button>
    </form>
  )
}
