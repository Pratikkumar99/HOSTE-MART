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
import { Camera, User, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'

export function RegisterForm() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [hostelType, setHostelType] = useState<'boys' | 'girls' | ''>('')
  const [email, setEmail] = useState('')
  const [emailVerified, setEmailVerified] = useState(false)
  const [verifyingEmail, setVerifyingEmail] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEmail(value)
    setEmailVerified(false)
    setEmailError(null)
  }

  const verifyEmail = async () => {
    if (!email) {
      setEmailError('Please enter an email address')
      return
    }

    setVerifyingEmail(true)
    setEmailError(null)

    try {
      const response = await fetch('/api/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify email')
      }

      if (data.valid) {
        setEmailVerified(true)
        toast.success('Email verified successfully')
      } else {
        setEmailVerified(false)
        setEmailError(data.message || 'Email verification failed')
        toast.error(data.message || 'Email verification failed')
      }
    } catch (error) {
      console.error('Email verification error:', error)
      setEmailVerified(false)
      setEmailError('Failed to verify email. Please try again.')
      toast.error('Failed to verify email')
    } finally {
      setVerifyingEmail(false)
    }
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
    const userEmail = formData.get('email') as string
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
        email: userEmail,
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
            handler_type: 'student',
            is_anonymous: false,
          },
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || window.location.origin}/auth/callback`,
        },
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('User creation failed')

      // Refresh session to ensure client is authenticated for storage operations
      const { error: sessionError } = await supabase.auth.refreshSession()
      if (sessionError) {
        console.warn('Session refresh warning:', sessionError)
      }

      // Small delay to ensure session is established
      await new Promise(resolve => setTimeout(resolve, 500))

      // 2. Create user profile with email provider
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: userEmail,
          name,
          roll_number: rollNumber,
          hostel_type: hostelType,
          hostel_name: hostelName,
          room_number: roomNumber,
          phone_number: phoneNumber,
          auth_provider: 'email',
          email_verified: emailVerified, // Use the verification status from email verification
        })

      if (profileError) {
        console.error('Profile creation error:', profileError)
        // Don't throw error here, as the auth user was created successfully
        // The profile will be created by the trigger if this fails
      }

      // 3. If avatar was uploaded, handle it after profile creation
      let avatarUrl: string | null = null
      if (avatarFile && authData.user) {
        // Upload avatar (non-blocking - don't fail registration if this fails)
        avatarUrl = await uploadAvatar(authData.user.id, avatarFile)

        if (avatarUrl) {
          // Update profile with avatar URL
          const { error: avatarUpdateError } = await supabase
            .from('profiles')
            .update({ avatar_url: avatarUrl })
            .eq('id', authData.user.id)

          if (avatarUpdateError) {
            console.error('Failed to update profile with avatar:', avatarUpdateError)
          }
        }
      }
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
            onClick={() => fileInputRef.current?.click()}
          >
            {avatarPreview ? (
              <AvatarImage src={avatarPreview} alt="Profile" className="object-cover" />
            ) : (
              <AvatarFallback className="bg-gray-100 dark:bg-black">
                <User className="h-8 w-8 text-gray-400" />
              </AvatarFallback>
            )}
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

      {/* Email Input with Verification */}
      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <div className="flex gap-2">
          <Input 
            id="email" 
            name="email" 
            type="email" 
            placeholder="john@example.com" 
            value={email}
            onChange={handleEmailChange}
            required 
          />
          <Button 
            type="button" 
            variant="outline" 
            onClick={verifyEmail}
            disabled={!email || verifyingEmail}
            className="whitespace-nowrap"
          >
            {verifyingEmail ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                {emailVerified ? (
                  <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="mr-2 h-4 w-4" />
                )}
                Verify
              </>
            )}
          </Button>
        </div>
        {emailError && (
          <p className="text-sm text-red-600">{emailError}</p>
        )}
        {emailVerified && (
          <p className="text-sm text-green-600">Email verified successfully</p>
        )}
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

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" placeholder="Enter your password" required />
      </div>

      <Button type="submit" className="w-full" disabled={loading || !emailVerified}>
        {loading ? 'Creating account...' : 'Register'}
      </Button>
    </form>
  )
}