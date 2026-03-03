// components/items/create-item-form.tsx
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
import { Upload, X } from 'lucide-react'

interface CreateItemFormProps {
  userId: string
  hostelType: 'boys' | 'girls'
}

export function CreateItemForm({ userId, hostelType }: CreateItemFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length + images.length > 5) {
      toast.error('Maximum 5 images allowed')
      return
    }

    const newImages = [...images, ...files]
    setImages(newImages)

    // Create previews
    const newPreviews = files.map(file => URL.createObjectURL(file))
    setImagePreviews([...imagePreviews, ...newPreviews])
  }

  const removeImage = (index: number) => {
    const newImages = [...images]
    const newPreviews = [...imagePreviews]
    
    URL.revokeObjectURL(newPreviews[index])
    newImages.splice(index, 1)
    newPreviews.splice(index, 1)
    
    setImages(newImages)
    setImagePreviews(newPreviews)
  }

  async function uploadImages(itemId: string) {
    const uploadedUrls: string[] = []
    
    for (let i = 0; i < images.length; i++) {
      const file = images[i]
      const fileExt = file.name.split('.').pop()
      const fileName = `${itemId}/${Date.now()}_${i}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('item-images')
        .upload(fileName, file)

      if (uploadError) {
        console.error('Upload error:', uploadError)
        continue
      }

      const { data: { publicUrl } } = supabase.storage
        .from('item-images')
        .getPublicUrl(fileName)

      uploadedUrls.push(publicUrl)
    }
    
    return uploadedUrls
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const price = parseFloat(formData.get('price') as string)
    const category = formData.get('category') as string
    const condition = formData.get('condition') as 'new' | 'like_new' | 'good' | 'fair'
    const hostelVisibleTo = hostelType

    try {
      // First create the item
      const { data: item, error: itemError } = await supabase
        .from('items')
        .insert({
          seller_id: userId,
          title,
          description,
          price,
          category,
          condition,
          hostel_visible_to: hostelVisibleTo,
          status: 'available',
          images: [],
        })
        .select()
        .single()

      if (itemError) throw itemError

      // Upload images if any
      if (images.length > 0) {
        const uploadedUrls = await uploadImages(item.id)
        
        // Update item with image URLs
        const { error: updateError } = await supabase
          .from('items')
          .update({ images: uploadedUrls })
          .eq('id', item.id)

        if (updateError) throw updateError
      }

      toast.success('Item listed successfully!')
      router.push('/dashboard/items')
      router.refresh()
    } catch (error) {
      console.error('Error creating item:', error)
      toast.error('Failed to create item')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <Label htmlFor="title">Item Title *</Label>
        <Input
          id="title"
          name="title"
          placeholder="e.g., Physics Textbook (Semester 3)"
          required
        />
      </div>

      <div className="space-y-4">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Describe your item in detail..."
          rows={4}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Label htmlFor="price">Price (₹) *</Label>
          <Input
            id="price"
            name="price"
            type="number"
            placeholder="500"
            min="0"
            step="1"
            required
          />
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Label htmlFor="condition">Condition *</Label>
          <Select name="condition" required>
            <SelectTrigger>
              <SelectValue placeholder="Select condition" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">Brand New</SelectItem>
              <SelectItem value="like_new">Like New</SelectItem>
              <SelectItem value="good">Good</SelectItem>
              <SelectItem value="fair">Fair</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4 dark:bg-black">
          <Label>Visibility</Label>
          <div className="p-3 bg-gray-50 rounded-lg border dark:bg-black">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Your item will be visible to: <span className="font-medium">{hostelType === 'boys' ? 'Boys Hostel' : 'Girls Hostel'}</span> only
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Label>Images (Max 5)</Label>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {imagePreviews.map((preview, index) => (
            <div key={index} className="relative aspect-square rounded-lg overflow-hidden border dark:bg-black">
              <img
                src={preview}
                alt={`Preview ${index + 1}`}
                className="object-cover w-full h-full"
              />
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="absolute top-1 right-1 h-6 w-6"
                onClick={() => removeImage(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
          
          {images.length < 5 && (
            <label className="aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
              <Upload className="h-8 w-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-600">Upload</span>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
              />
            </label>
          )}
        </div>
        <p className="text-sm text-gray-500">
          Upload clear images of your item from different angles
        </p>
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
          {loading ? 'Listing Item...' : 'List Item'}
        </Button>
      </div>
    </form>

    </div>
  )
}