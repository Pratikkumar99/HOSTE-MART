// app/(dashboard)/requests/page.tsx
import { createClient } from "@/lib/supabase/server";
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

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Build query for requests
  let query = supabase
    .from("requests")
    .select(
      `
      *,
      requester:profiles(name, room_number, hostel_name, avatar_url)
    `,
    )
    .eq("status", "open")
    .eq("hostel_type", profile.hostel_type);

  // Apply search filter
  const search = searchParams.search as string;
  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  }

  // Apply category filter
  const category = searchParams.category as string;
  if (category && category !== "all") {
    query = query.eq("category", category);
  }

  // Apply urgency filter
  const urgency = searchParams.urgency as string;
  if (urgency && urgency !== "all") {
    query = query.eq("urgency", urgency);
  }

  const { data: requests } = await query.order("created_at", {
    ascending: false,
  });

  return (
    <div className="space-y-6">
      <BackButton />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Requests</h1>
          <p className="text-gray-600 mt-2">
            See what others in your hostel are looking for
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/requests/new">
            <ShoppingCart className="mr-2 h-4 w-4" />
            Make Request
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border p-4">
        <form className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              name="search"
              placeholder="Search requests..."
              className="pl-10"
              defaultValue={search}
            />
          </div>

          <Select name="category" defaultValue={category}>
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="books">Books & Notes</SelectItem>
              <SelectItem value="electronics">Electronics</SelectItem>
              <SelectItem value="furniture">Furniture</SelectItem>
              <SelectItem value="clothing">Clothing</SelectItem>
              <SelectItem value="sports">Sports Equipment</SelectItem>
              <SelectItem value="stationery">Stationery</SelectItem>
            </SelectContent>
          </Select>

          <Select name="urgency" defaultValue={urgency}>
            <SelectTrigger>
              <SelectValue placeholder="Urgency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Urgency</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1 gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            <Button type="reset" variant="outline" asChild>
              <Link href="/dashboard/requests">Clear</Link>
            </Button>
          </div>
        </form>
      </div>

      {/* Requests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {requests && requests.length > 0 ? (
          requests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              currentUser={profile}
            />
          ))
        ) : (
          <div className="col-span-2 text-center py-12">
            <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No requests found
            </h3>
            <p className="text-gray-600 mb-4">
              {search
                ? "Try adjusting your search filters"
                : "Be the first to make a request!"}
            </p>
            {!search && (
              <Button asChild>
                <Link href="/dashboard/requests/new">Make a Request</Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
