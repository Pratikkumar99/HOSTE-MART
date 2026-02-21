// components/requests/create-request-form.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

interface CreateRequestFormProps {
  userId: string
  hostelType: 'boys' | 'girls'
}

export function CreateRequestForm({ userId, hostelType }: CreateRequestFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const urgency = formData.get('urgency') as 'low' | 'medium' | 'high' | 'urgent'
    const maxPrice = formData.get('maxPrice') ? parseFloat(formData.get('maxPrice') as string) : null
    const category = formData.get('category') as string

    const { error } = await supabase
      .from('requests')
      .insert({
        requester_id: userId,
        title,
        description,
        urgency,
        max_price: maxPrice,
        category,
        hostel_type: hostelType,
        status: 'open',
      })

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Request posted successfully!')
      router.push('/dashboard/requests')
      router.refresh()
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 dark:bg-black">
      <div className="space-y-4">
        <Label htmlFor="title">What do you need? *</Label>
        <Input
          id="title"
          name="title"
          placeholder="e.g., Physics Textbook, Calculator, Chair"
          required
        />
      </div>

      <div className="space-y-4">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Provide details about what you're looking for..."
          rows={4}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Label htmlFor="urgency">Urgency *</Label>
          <Select name="urgency" defaultValue="medium" required>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low - Anytime</SelectItem>
              <SelectItem value="medium">Medium - This week</SelectItem>
              <SelectItem value="high">High - Need soon</SelectItem>
              <SelectItem value="urgent">Urgent - Today</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          <Label htmlFor="maxPrice">Maximum Budget (₹)</Label>
          <Input
            id="maxPrice"
            name="maxPrice"
            type="number"
            placeholder="Optional"
            min="0"
            step="1"
          />
        </div>
      </div>

      <div className="space-y-4">
        <Label htmlFor="category">Category *</Label>
        <Select name="category" required>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="books">Books & Notes</SelectItem>
            <SelectItem value="electronics">Electronics</SelectItem>
            <SelectItem value="furniture">Furniture</SelectItem>
            <SelectItem value="clothing">Clothing</SelectItem>
            <SelectItem value="sports">Sports Equipment</SelectItem>
            <SelectItem value="stationery">Stationery</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
          className='cursor-pointer'
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className='cursor-pointer'>
          {loading ? 'Posting Request...' : 'Post Request'}
        </Button>
      </div>
    </form>
  )
}