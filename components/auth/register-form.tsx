'use client'
 
import { useState, useRef } from 'react'
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
import { Camera, User } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
 
export function RegisterForm() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
 
  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }
 
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image size should be less than 2MB')
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }
 
  async function uploadAvatar(userId: string, file: File): Promise<string | null> {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`
 
      // Upload the file
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        })
 
      if (uploadError) throw uploadError
 
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)
 
      return publicUrl
    } catch (error) {
      console.error('Error uploading avatar:', error)
      return null
    }
  }
 
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
    const avatarFile = fileInputRef.current?.files?.[0]
    
    try {
      // 1. First, create the user account
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
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
 
      if (authError) throw authError
      if (!authData.user) throw new Error('User creation failed')
 
      // 2. Create the profile first without avatar
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          email,
          name,
          roll_number: rollNumber,
          room_number: roomNumber,
          hostel_type: hostelType,
          hostel_name: hostelName,
          phone_number: phoneNumber,
          updated_at: new Date().toISOString(),
        })
 
      if (profileError) throw profileError
 
      // 3. If avatar was uploaded, handle it after profile creation
      let avatarUrl: string | null = null
      if (avatarFile && authData.user) {
        // Small delay to ensure session is established
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Upload avatar
        avatarUrl = await uploadAvatar(authData.user.id, avatarFile)
        
        if (avatarUrl) {
          // Update profile with avatar URL
          await supabase
            .from('profiles')
            .update({ avatar_url: avatarUrl })
            .eq('id', authData.user.id)
        }
      }
 
      toast.success('Registration successful! Please check your email to verify your account.')
      router.push('/login?registered=true')
 
    } catch (error) {
      console.error('Registration error:', error)
      toast.error(error instanceof Error ? error.message : 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }
 
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar Upload */}
      <div className="flex flex-col items-center">
        <div className="relative">
          <Avatar 
            className="h-24 w-24 cursor-pointer border-2 border-dashed border-gray-300 hover:border-primary transition-colors"
            onClick={handleAvatarClick}
          >
            {avatarPreview ? (
              <AvatarImage src={avatarPreview} alt="Profile" className="object-cover" />
            ) : (
              <AvatarFallback className="bg-gray-100 dark:bg-black">
                <User className="h-8 w-8 text-gray-400" />
              </AvatarFallback>
            )}
            <div className="absolute bottom-0 right-0 bg-primary p-2 rounded-full">
            </div>
          </Avatar>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarChange}
            accept="image/*"
            className="hidden"
          />
        </div>
        <p className="mt-2 text-sm text-gray-500">Click to upload a profile picture (optional)</p>
      </div>

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