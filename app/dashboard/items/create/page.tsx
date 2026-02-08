// app/dashboard/items/create/page.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { ArrowLeft, Upload, X } from "lucide-react"
import Link from "next/link"
import { MatchingService } from "@/lib/matching"

export default function CreateItemPage() {
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const router = useRouter()
  const supabase = createClient()
  const matchingService = new MatchingService()

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    condition: "",
    hostel_visible_to: "both" as "boys" | "girls" | "both",
  })

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const newImageFiles = [...imageFiles, ...files].slice(0, 5) // Max 5 images
    
    setImageFiles(newImageFiles)
    
    // Upload images and get URLs
    const uploadPromises = newImageFiles.map(async (file) => {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${fileName}`
      
      const { error: uploadError } = await supabase.storage
        .from('item-images')
        .upload(filePath, file)
      
      if (uploadError) throw uploadError
      
      const { data } = supabase.storage
        .from('item-images')
        .getPublicUrl(filePath)
      
      return data.publicUrl
    })
    
    try {
      const uploadedUrls = await Promise.all(uploadPromises)
      setImages(uploadedUrls)
    } catch (error) {
      toast.error("Failed to upload images")
    }
  }

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    const newFiles = imageFiles.filter((_, i) => i !== index)
    setImages(newImages)
    setImageFiles(newFiles)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      // Get user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("hostel_type")
        .eq("id", user.id)
        .single()

      if (!profile) throw new Error("Profile not found")

      // Create the item
      const { data: item, error: itemError } = await supabase
        .from("items")
        .insert({
          seller_id: user.id,
          title: formData.title,
          description: formData.description,
          price: parseFloat(formData.price),
          category: formData.category,
          condition: formData.condition,
          images: images,
          hostel_visible_to: formData.hostel_visible_to,
          status: "available",
        })
        .select()
        .single()

      if (itemError) throw itemError

      // Check for matching requests and create notifications
      const matches = await matchingService.checkForMatches(item)
      
      for (const match of matches) {
        // Get the requester's user ID
        const { data: requestData } = await supabase
          .from('requests')
          .select('requester_id')
          .eq('id', match.matchedWith.id)
          .single()
        
        if (requestData) {
          await matchingService.createNotification(match, requestData.requester_id)
        }
      }

      toast.success("Item posted successfully!")
      
      if (matches.length > 0) {
        toast.success(`Found ${matches.length} matching requests! Notifications sent.`)
      }
      
      router.push("/dashboard")
    } catch (error) {
      console.error("Error creating item:", error)
      toast.error("Failed to create item")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sell an Item</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Used Textbook - Introduction to Computer Science"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe your item, condition, and any other relevant details..."
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (₹) *</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="500"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="books">Books</SelectItem>
                    <SelectItem value="clothing">Clothing</SelectItem>
                    <SelectItem value="furniture">Furniture</SelectItem>
                    <SelectItem value="sports">Sports & Equipment</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="condition">Condition *</Label>
                <Select value={formData.condition} onValueChange={(value) => setFormData({ ...formData, condition: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="like_new">Like New</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hostel_visible_to">Visible to</Label>
                <Select value={formData.hostel_visible_to} onValueChange={(value: "boys" | "girls" | "both") => setFormData({ ...formData, hostel_visible_to: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="boys">Boys Hostel</SelectItem>
                    <SelectItem value="girls">Girls Hostel</SelectItem>
                    <SelectItem value="both">Both Hostels</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Images (Max 5)</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="flex flex-col items-center justify-center cursor-pointer"
                >
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">Click to upload images</span>
                  <span className="text-xs text-gray-400">PNG, JPG, GIF up to 10MB each</span>
                </label>
              </div>
              
              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {images.map((url, index) => (
                    <div key={index} className="relative">
                      <img
                        src={url}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-24 object-cover rounded"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Posting..." : "Post Item"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
