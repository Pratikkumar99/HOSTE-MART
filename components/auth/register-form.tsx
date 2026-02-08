// components/auth/register-form.tsx
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
import { toast } from 'sonner'

export function RegisterForm() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const name = formData.get('name') as string
    const rollNumber = formData.get('rollNumber') as string
    const roomNumber = formData.get('roomNumber') as string
    const hostelType = formData.get('hostelType') as 'boys' | 'girls'
    const hostelName = formData.get('hostelName') as string
    const phoneNumber = formData.get('phoneNumber') as string

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          full_name: name,
          roll_number: rollNumber,
          role: 'user',
          hostel_type: hostelType,
          hostel_name: hostelName,
          room_number: roomNumber,
          phone_number: phoneNumber,
          handler_type: 'student',
        },
      },
    })

    if (authError) {
      toast.error(authError.message)
      setLoading(false)
      return
    }

    if (!authData.session) {
      toast.success('Account created. Please check your email to verify, then sign in.')
      router.push('/login')
      setLoading(false)
      return
    }

    if (authData.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email,
          name,
          roll_number: rollNumber,
          room_number: roomNumber,
          hostel_type: hostelType,
          hostel_name: hostelName,
          phone_number: phoneNumber,
        })

      if (profileError) {
        toast.error(profileError.message)
      } else {
        toast.success('Registration successful! Please check your email to verify.')
        router.push('/dashboard')
        router.refresh()
      }
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input id="name" name="name" placeholder="John Doe" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="rollNumber">Roll Number</Label>
          <Input id="rollNumber" name="rollNumber" placeholder="2023CS101" required />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" placeholder="student@university.edu" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" required minLength={6} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="hostelType">Hostel Type</Label>
          <Select name="hostelType" required>
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
          <Input id="hostelName" name="hostelName" placeholder="BH-3/GH-3" required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="roomNumber">Room Number</Label>
          <Input id="roomNumber" name="roomNumber" placeholder="A-101" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phoneNumber">Phone Number</Label>
          <Input id="phoneNumber" name="phoneNumber" placeholder="+91 9876543210" />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Creating account...' : 'Register'}
      </Button>
    </form>
  )
}