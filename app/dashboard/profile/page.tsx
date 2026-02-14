// app/(dashboard)/profile/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Mail,
  Phone,
  Hash,
  Home,
  Calendar,
  Edit
} from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { BackButton } from "@/components/ui/back-button";

export default async function ProfilePage() {
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

  // Fetch user's items
  const { data: items } = await supabase
    .from("items")
    .select("*")
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false });

  // Fetch user's requests
  const { data: requests } = await supabase
    .from("requests")
    .select("*")
    .eq("requester_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <BackButton />
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-gray-600 mt-2">Manage your account and activities</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Info */}
        <Card className="lg:col-span-1">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={profile.avatar_url} alt={profile.name} />
                <AvatarFallback className="text-2xl">
                  {profile.name.charAt(0)}
                </AvatarFallback>
              </Avatar>

              <h2 className="text-xl font-bold">{profile.name}</h2>
              <p className="text-gray-600">{profile.email}</p>

              <Badge className="mt-2 capitalize">
                {profile.hostel_type} Hostel
              </Badge>

              <div className="mt-6 space-y-3 w-full">
                <div className="flex items-center gap-2 text-sm">
                  <Hash className="h-4 w-4 text-gray-400" />
                  <span>Roll No: {profile.roll_number}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Home className="h-4 w-4 text-gray-400" />
                  <span>
                    {profile.hostel_name}, Room {profile.room_number}
                  </span>
                </div>
                {profile.phone_number && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>{profile.phone_number}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>Joined {formatDate(profile.created_at)}</span>
                </div>
              </div>

              <Link href="/dashboard/profile/edit">
                <Button className="w-full mt-6 bg-primary hover:bg-primary/90" size="lg">
                Edit Profile
              </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Stats & Activities */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Items Listed</p>
                  <p className="text-3xl font-bold mt-2">
                    {items?.length || 0}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Items Requested</p>
                  <p className="text-3xl font-bold mt-2">
                    {requests?.length || 0}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Items */}
          <Card>
            <CardHeader>
              <CardTitle>Your Listed Items</CardTitle>
            </CardHeader>
            <CardContent>
              {items && items.length > 0 ? (
                <div className="space-y-3">
                  {items.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-sm text-gray-600">
                          ₹{item.price} • {item.status}
                        </p>
                      </div>
                      <Badge
                        className={
                          item.status === "available"
                            ? "bg-green-100 text-green-800"
                            : item.status === "reserved"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                        }
                      >
                        {item.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No items listed yet
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent Requests */}
          <Card>
            <CardHeader>
              <CardTitle>Your Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {requests && requests.length > 0 ? (
                <div className="space-y-3">
                  {requests.slice(0, 5).map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{request.title}</p>
                        <p className="text-sm text-gray-600">
                          {request.category} • {request.urgency}
                        </p>
                      </div>
                      <Badge
                        className={
                          request.status === "open"
                            ? "bg-green-100 text-green-800"
                            : request.status === "fulfilled"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                        }
                      >
                        {request.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No requests made yet
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
