// components/requests/request-card.tsx
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { MatchingService } from "@/lib/matching";
import { notificationService } from "@/lib/notifications";
import {
  MapPin,
  MessageSquare,
  IndianRupee,
  Calendar,
  AlertCircle,
  Trash2,
  Loader2,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { Request } from "@/types";

interface RequestCardProps {
  request: Request;
  currentUser: {
    id: string;
    hostel_type: "boys" | "girls";
  };
}

export function RequestCard({ request, currentUser }: RequestCardProps) {
  const supabase = createClient();
  // notificationService is now imported as a singleton
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleDeleteRequest = async () => {
    if (request.requester_id !== currentUser.id) {
      toast.error("You can only delete your own requests");
      return;
    }

    setIsDeleting(true);
    
    try {
      console.log(' Starting request deletion:', request.id);
      
      // Delete associated chat rooms first (if any)
      console.log('Deleting chat rooms for request:', request.id);
      const { error: chatError } = await supabase
        .from('chat_rooms')
        .delete()
        .eq('request_id', request.id);

      if (chatError) {
        console.error('Error deleting chat rooms:', chatError);
        throw chatError;
      } else {
        console.log('Chat rooms deleted successfully');
      }

      // Delete the request
      console.log('Deleting request:', request.id);
      const { error } = await supabase
        .from('requests')
        .delete()
        .eq('id', request.id);

      if (error) {
        console.error('Error deleting request:', error);
        throw error;
      }

      console.log('Request deleted successfully');
      toast.success('Request deleted successfully');
      window.location.reload(); // Refresh the page to update the UI
    } catch (error) {
      console.error('Failed to delete request:', error);
      toast.error('Failed to delete request');
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleStartChat = async () => {
    if (request.requester_id === currentUser.id) {
      toast.error("You can't chat with yourself");
      return;
    }

    setIsStartingChat(true);

    try {
      // Check if chat room already exists
      const { data: existingChat } = await supabase
        .from("chat_rooms")
        .select("id")
        .eq("request_id", request.id)
        .eq("buyer_id", currentUser.id)
        .single();

      if (existingChat) {
        window.location.href = `/dashboard/chat/${existingChat.id}`;
        return;
      }

      // Create new chat room
      const { data: chatRoom, error } = await supabase
        .from("chat_rooms")
        .insert({
          request_id: request.id,
          buyer_id: currentUser.id,
          seller_id: request.requester_id,
          status: "active",
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Chat started!");
      window.location.href = `/dashboard/chat/${chatRoom.id}`;
    } catch (error) {
      console.error("Failed to start chat:", error);
      toast.error("Failed to start chat");
    } finally {
      setIsStartingChat(false);
    }
  };

  const urgencyColors = {
    low: "bg-green-100 text-green-800",
    medium: "bg-blue-100 text-blue-800",
    high: "bg-yellow-100 text-yellow-800",
    urgent: "bg-red-100 text-red-800",
  };
  // components/requests/request-card.tsx

  const handleAcceptRequest = async () => {
    if (request.requester_id === currentUser.id) {
      toast.error("You can't accept your own request");
      return;
    }

    setIsStartingChat(true);

    try {
      // 1. Check if chat room already exists
      const { data: existingChat } = await supabase
        .from("chat_rooms")
        .select("id")
        .eq("request_id", request.id)
        .eq("buyer_id", currentUser.id)
        .single();

      if (existingChat) {
        window.location.href = `/dashboard/chat/${existingChat.id}`;
        return;
      }

      // 2. Create new chat room
      const { data: chatRoom, error: chatError } = await supabase
        .from("chat_rooms")
        .insert({
          request_id: request.id,
          buyer_id: currentUser.id,
          seller_id: request.requester_id,
          status: "active",
          last_message_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (chatError) throw chatError;

      // 3. Send notification to the requester
      await notificationService.createChatNotification(
        chatRoom.id,
        currentUser.id,
        request.requester_id,
        undefined,
        request.title
      );

      // 4. Update request status to 'accepted'
      const { error: updateError } = await supabase
        .from("requests")
        .update({ status: "accepted", accepted_by: currentUser.id })
        .eq("id", request.id);

      if (updateError) throw updateError;

      // 5. Send a system message
      await supabase.from("messages").insert({
        chat_room_id: chatRoom.id,
        sender_id: currentUser.id,
        content: `I can help with your request: ${request.title}`,
        is_system_message: true,
      });

      toast.success("Request accepted! Requester has been notified.");
      window.location.href = `/dashboard/chat/${chatRoom.id}`;
    } catch (error) {
      console.error("Failed to accept request:", error);
      toast.error("Failed to accept request. Please try again.");
    } finally {
      setIsStartingChat(false);
    }
  };
  

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow h-full flex flex-col w-full">
        <CardContent className="p-4 flex-1">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h3 className="font-semibold text-lg line-clamp-1">
                {request.title}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  className={
                    urgencyColors[request.urgency as keyof typeof urgencyColors]
                  }
                >
                  {request.urgency}
                </Badge>
                {request.max_price && (
                  <Badge variant="outline" className="flex items-center">
                    <IndianRupee className="h-3 w-3 mr-1" />
                    Max {request.max_price}
                  </Badge>
                )}
              </div>
            </div>
            {request.requester && (
              <Avatar className="h-10 w-10">
                {request.requester.avatar_url ? (
                  <AvatarImage
                    src={request.requester.avatar_url}
                    alt={request.requester.name || 'User'}
                    className="object-cover"
                  />
                ) : null}
                <AvatarFallback className="bg-gray-200">
                  {request.requester.name ? request.requester.name.charAt(0).toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>
            )}
          </div>

          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {request.description}
          </p>

          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(request.created_at)}</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span>{request.requester?.hostel_name}</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-6 pt-0 flex gap-2">
          <Button
            variant="outline"
            className="flex-1 cursor-pointer"
            onClick={() => setIsDialogOpen(true)}
          >
            View Details
          </Button>

          {request.requester_id === currentUser.id ? (
            <Button
              variant="destructive"
              size="sm"
              className="flex-1 cursor-pointer"
              onClick={() => setIsDeleteDialogOpen(true)}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          ) : (
            <Button
              onClick={handleStartChat}
              disabled={isStartingChat || request.requester_id === currentUser.id}
              className="flex-1 gap-2 cursor-pointer"
            >
              <MessageSquare className="h-4 w-4" />
              {isStartingChat ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "I Have This"
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
      {/* Request Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl dark:border dark:border-white/30">
          <DialogHeader>
            <DialogTitle>{request.title}</DialogTitle>
            <DialogDescription>
              Requested on {formatDate(request.created_at)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Badge
                className={
                  urgencyColors[request.urgency as keyof typeof urgencyColors]
                }
              >
                {request.urgency} priority
              </Badge>
              {request.max_price && (
                <div className="flex items-center text-lg font-semibold">
                  <IndianRupee className="h-4 w-4" />
                  Maximum budget: {request.max_price}
                </div>
              )}
            </div>

            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-gray-700 whitespace-pre-wrap dark:text-white/50">
                {request.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-white">Category</p>
                <p className="font-medium dark:text-white/50">{request.category}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-white">Status</p>
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
            </div>

            {request.requester && (
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3">Requester Information</h3>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={request.requester.avatar_url}
                      alt={request.requester.name}
                    />
                    <AvatarFallback>
                      {request.requester.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{request.requester.name}</p>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <MapPin className="h-3 w-3 dark:text-white/50" />
                      <span className="dark:text-white/50">
                        {request.requester.hostel_name}, Room{" "}
                        {request.requester.room_number}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Close
            </Button>
            {request.requester_id !== currentUser.id && (
              <Button
                onClick={handleStartChat}
                disabled={request.requester_id === currentUser.id}
                className="gap-2"
              >
                <MessageSquare className="h-4 w-4" />I Have This Item
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this request? This action cannot be undone and will also remove any associated chat rooms.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteRequest}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Request
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
