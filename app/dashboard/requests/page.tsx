// app/dashboard/requests/page.tsx
"use client";

import { createClient } from "@/lib/supabase/client";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShoppingCart, Search, Filter } from "lucide-react";
import Link from "next/link";
import { RequestCard } from "@/components/requests/request-card";
import { BackButton } from "@/components/ui/back-button";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Request } from "@/types";

export default function RequestsPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [profile, setProfile] = useState<{
    id: string;
    hostel_type: "boys" | "girls";
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    category: "all",
    urgency: "all",
  });

  const supabase = createClient();

  // Fetch data when component mounts or filters change
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Get user session
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();
        if (authError || !user) {
          redirect("/login");
          return;
        }

        // Get user profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError || !profileData) {
          redirect("/login");
          return;
        }

        setProfile(profileData);

        // Build query for requests
        let query = supabase
          .from("requests")
          .select(
            "*, requester:profiles(name, room_number, hostel_name, avatar_url)",
          )
          .eq("status", "open")
          .eq("hostel_type", profileData.hostel_type);

        // Apply search filter
        if (filters.search) {
          query = query.or(
            `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`,
          );
        }

        // Apply category filter
        if (filters.category !== "all") {
          query = query.eq("category", filters.category);
        }

        // Apply urgency filter
        if (filters.urgency !== "all") {
          query = query.eq("urgency", filters.urgency);
        }

        const { data: requestsData, error } = await query.order("created_at", {
          ascending: false,
        });

        if (error) throw error;

        setRequests(requestsData || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load requests");
      } finally {
        setLoading(false);
      }
    };

    // Add debounce to prevent too many API calls
    const timer = setTimeout(() => {
      fetchData();
    }, 300);

    return () => clearTimeout(timer);
  }, [filters]);

  const categories = [
    "all",
    "books",
    "electronics",
    "furniture",
    "clothing",
    "sports",
    "stationery",
    "other",
  ];

  const urgencyLevels = ["all", "low", "medium", "high", "urgent"];

  if (loading && requests.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <BackButton />
      <div className="space-y-6 mx-auto max-w-7/1 px-4 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-3xl font-bold">Requests</h1>
          <p className="text-gray-600 mt-2">
            See what others in your hostel are looking for
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search requests..."
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, search: e.target.value }))
                }
                className="pl-10"
              />
            </div>
          </div>

          <Select
            value={filters.category}
            onValueChange={(value) =>
              setFilters((prev) => ({ ...prev, category: value }))
            }
          >
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category === "all"
                    ? "All Categories"
                    : category.charAt(0).toUpperCase() + category.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.urgency}
            onValueChange={(value) =>
              setFilters((prev) => ({ ...prev, urgency: value }))
            }
          >
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Urgency" />
            </SelectTrigger>
            <SelectContent>
              {urgencyLevels.map((level) => (
                <SelectItem key={level} value={level}>
                  {level === "all"
                    ? "All Urgency"
                    : level.charAt(0).toUpperCase() + level.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Add New Request Button */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Open Requests</h2>
          <Link href="/dashboard/requests/new">
            <Button className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              Make a Request
            </Button>
          </Link>
        </div>

        {/* Requests Grid */}
        {requests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {requests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                currentUser={profile!} // We know profile is not null here because of the redirect
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No requests found</h3>
            <p className="text-muted-foreground mb-4">
              {filters.search ||
              filters.category !== "all" ||
              filters.urgency !== "all"
                ? "Try adjusting your filters or search query."
                : "Be the first to make a request!"}
            </p>
            <Link href="/dashboard/requests/new">
              <Button>Make a Request</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
