// app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Package, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { ItemCard } from "@/components/items/item-card";
import { RequestCard } from "@/components/requests/request-card";
import { Item, Request } from "@/types";

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [items, setItems] = useState<Item[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string; hostel_type: 'boys' | 'girls' } | null>(null);
  const [recentRequests, setRecentRequests] = useState<Request[]>([]);

  useEffect(() => {
    const loadRecentRequests = async () => {
      if (!currentUser) return;
      
      const { data: requests, error } = await supabase
        .from('requests')
        .select(`
          *,
          requester:profiles!requester_id (
            id,
            name,
            avatar_url,
            hostel_name,
            room_number
          )
        `)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(5); // Show only 5 recent requests

      if (error) {
        console.error('Error fetching recent requests:', error);
      } else {
        setRecentRequests(requests || []);
      }
    };

    loadRecentRequests();
  }, [currentUser, supabase]);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        if (!session) {
          if (isMounted) {
            router.push("/login");
          }
          return;
        }

        // Get user profile
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (profileError) throw profileError;
        
        if (!profile) {
          if (isMounted) {
            router.push("/setup-profile");
          }
          return;
        }

        // Build the base query
        let query = supabase
          .from("items")
          .select(`
            *,
            seller:profiles(name, room_number, hostel_name, avatar_url)
          `)
          .eq("status", "available");

        // Apply hostel type filter if available
        if (profile.hostel_type) {
          query = query.or(
            `hostel_visible_to.eq.both,hostel_visible_to.eq.${profile.hostel_type}`
          );
        } else {
          query = query.eq("hostel_visible_to", "both");
        }

        // Execute the query
        const { data: items, error: itemsError } = await query
          .order("created_at", { ascending: false })
          .limit(8);

        if (itemsError) throw itemsError;

        // Fetch requests
        const { data: requests, error: requestsError } = await supabase
          .from('requests')
          .select(`
            *,
            requester:profiles(name, room_number, hostel_name, avatar_url)
          `)
          .eq('status', 'open')
          .order('created_at', { ascending: false });

        if (requestsError) throw requestsError;
        
        if (isMounted) {
          setItems(items || []);
          setRequests(requests || []);
          setCurrentUser({
            id: session.user.id,
            hostel_type: profile.hostel_type as 'boys' | 'girls'
          });
        }
      } catch (err) {
        console.error("Error loading dashboard:", err);
        if (isMounted) {
          setError("Failed to load dashboard data");
          toast.error("Failed to load dashboard. Please try again.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-600 mb-4">{error}</div>
        <Button 
          onClick={() => window.location.reload()} 
          className="bg-primary hover:bg-primary/90"
        >
          Retry
        </Button>
      </div>
    );
  }

  // Sort requests by urgency (high to low)
  const sortedRequests = [...requests].sort((a, b) => {
    const urgencyOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
    return (urgencyOrder[b.urgency as keyof typeof urgencyOrder] || 0) - (urgencyOrder[a.urgency as keyof typeof urgencyOrder] || 0);
  });

  return (
    <div className="space-y-8 md:p-8 max-w-8xl mx-auto">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">Buy & Sell Items</h1>
        <div className="flex flex-col sm:flex-row gap-3 w-1/2  md:w-auto">
          <Button asChild className="w-full md:w-auto">
            <Link href="/dashboard/items/new" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Sell Item
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full md:w-auto">
            <Link href="/dashboard/requests/new" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Make Request
            </Link>
          </Button>
        </div>
      </div>
      {/* Requested Items Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Requested Items</h2>
        {sortedRequests.length > 0 && currentUser ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedRequests.map((request) => (
              <RequestCard 
                key={request.id} 
                request={request} 
                currentUser={currentUser}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <Package className="h-10 w-10 mx-auto text-gray-300" />
            <p className="mt-2 text-gray-500">No active requests at the moment</p>
          </div>
        )}
      </div>

      <h2 className="text-xl font-bold">Available Items</h2>
      {items.length > 0 && currentUser ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item) => (
            <ItemCard 
              key={item.id} 
              item={item} 
              currentUser={currentUser}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            No items found
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            There are currently no items listed in your hostel. Be the first to list an item!
          </p>
          <Button asChild>
            <Link 
              href="/dashboard/items/new" 
              className="bg-primary hover:bg-primary/90"
            >
              <Package className="h-4 w-4 mr-2" />
              List an Item
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}