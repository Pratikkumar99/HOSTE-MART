"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { User } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Upload, ArrowLeft, Store, Users, Phone, Mail } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function BusinessSetupPage() {
  const [loading, setLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .single();
        if (profileData) {
          setProfile(profileData);
          // Automatically set hostel type based on user profile
          setFormData((prev) => ({
            ...prev,
            hostel_type: profileData.hostel_type || "",
          }));
        }
      }
    };
    fetchProfile();
  }, []);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "Accessories", // Default to food
    hostel_type: "", // Will be set based on user profile
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Ensure profile is loaded
      if (!profile) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        if (profileData) {
          setProfile(profileData);
        } else {
          throw new Error("Profile not found");
        }
      }

      let logo_url = null;

      // Upload logo if selected
      if (logoFile) {
        const fileExt = logoFile.name.split(".").pop();
        const fileName = `${user.id}/${Math.random()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("business-logos")
          .upload(fileName, logoFile);

        if (uploadError) {
          console.error("Upload error:", uploadError);
          throw uploadError;
        }

        const { data } = supabase.storage
          .from("business-logos")
          .getPublicUrl(fileName);
        logo_url = data.publicUrl;
      }

      // Create business
      const { data: business, error } = await supabase
        .from("businesses")
        .insert({
          owner_id: user.id,
          ...formData,
          location: `${profile?.hostel_name}, Room ${profile?.room_number}`, // Auto-generate from profile
          logo_url,
          is_verified: false, // Auto-set to false
          status: "active",
        })
        .select()
        .single();

      if (error) throw error;

      // Update user profile with business_id
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ business_id: business.id })
        .eq("id", user.id);

      if (profileError) throw profileError;

      toast.success("Business created successfully!");
      router.push("/business/dashboard");
    } catch (error) {
      console.error("Error creating business:", error);
      toast.error("Failed to create business");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="flex-1">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-6 my-4 dark:hover:text-gray-100"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>
        <main className="p-6 w-fit mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Store className="w-10 h-10 text-primary" />
                <CardTitle className="text-2xl">Set Up Your Business</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Logo Upload */}
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden mb-3 border-2 border-dashed border-gray-300">
                    {logoPreview ? (
                      <Image
                        src={logoPreview}
                        alt="Logo preview"
                        width={96}
                        height={96}
                        className="object-cover"
                      />
                    ) : (
                      <Store className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <Label htmlFor="logo" className="cursor-pointer">
                    <div className="flex items-center gap-2 text-sm text-primary hover:underline">
                      <Upload className="w-4 h-4" />
                      Add Logo (Optional)
                    </div>
                    <input
                      id="logo"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoChange}
                    />
                  </Label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Business Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="e.g., crochet earrings collection"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">What do you sell? *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) =>
                        setFormData({ ...formData, category: value })
                      }
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Accessories">Accessories</SelectItem>
                        <SelectItem value="electronics">Electronics</SelectItem>
                        <SelectItem value="clothing">Clothing</SelectItem>
                        <SelectItem value="food">Food & Beverages</SelectItem>
                        <SelectItem value="stationery">Stationery</SelectItem>
                        <SelectItem value="services">Services</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="e.g., crochet earrings collection for daily wear"
                    required
                    rows={3}
                  />
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>
                      <Store className="w-4 h-4 inline mr-2" />
                      Business Location
                    </Label>
                    <div className="px-3 py-2 bg-gray-100 rounded-md text-sm font-medium dark:bg-black dark:text-white w-fit">
                      {profile?.hostel_name}, Room {profile?.room_number}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Your business location is automatically set from your profile
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>
                      <Users className="w-4 h-4 inline mr-2" />
                      Your Hostel Type
                    </Label>
                    <div className="px-3 py-2 bg-gray-100 rounded-md text-sm font-medium dark:bg-black dark:text-white w-fit">
                      {profile?.hostel_type === "boys"
                        ? "Boys Hostel"
                        : "Girls Hostel"}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Your business will only be visible to students in your
                      hostel
                    </p>
                  </div>
                </div>

                <div className="flex justify-center">
                  <Button
                    type="submit"
                    className="w-full dark:bg-white dark:text-black"
                    size="lg"
                    disabled={loading}
                  >
                    {loading ? "Creating Business..." : "Create Business"}
                  </Button>
                </div>

                <p className="text-xs text-gray-500 text-center">
                  Only required fields marked with * are needed to start. You
                  can add more details later.
                </p>
              </form>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
