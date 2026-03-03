"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { User } from "@/types";
import { LogOut, Bell, Menu, X, Store, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface HeaderProps {
  profile: User;
}

export function DashboardHeader({ profile }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const pathname = usePathname();

  // Close mobile menu when route changes
  useEffect(() => {
    const handleRouteChange = () => {
      setIsMobileMenuOpen(false);
    };

    // Listen for route changes
    window.addEventListener("popstate", handleRouteChange);
    return () => {
      window.removeEventListener("popstate", handleRouteChange);
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(
        `/dashboard/items?search=${encodeURIComponent(searchQuery.trim())}`,
      );
    }
  };

  // Only show search bar on the main dashboard page
  const showSearch = pathname === "/dashboard";

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      // Clear any cached data
      if (typeof window !== "undefined") {
        localStorage.clear();
        sessionStorage.clear();
      }

      // Force a full page reload to clear all state
      window.location.href = "/login";
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <header className="relative flex h-18 items-center justify-between border-b bg-background px-4 dark:border-white/20 dark:border-b">
      <div className="flex items-center gap-4">
        <div
          className="flex items-center cursor-pointer"
          onClick={() => router.push("/dashboard")}
        >
          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 -ml-2 mr-4 cursor-pointer"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
          <img src="/logo.png" alt="" className="h-10 w-10 bg-white rounded-full dark:invert" />
        </div>
        <span className="font-bold text-lg hidden sm:block ml-2">
          <p
            onClick={() => router.push("/dashboard")}
            className="cursor-pointer"
          >
            Marketplace
          </p>
        </span>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center gap-6">
        <Button
          variant="ghost"
          className="text-sm font-medium cursor-pointer"
          onClick={() => router.push("/dashboard/items")}
        >
          Sell Items
        </Button>
        <Button
          variant="ghost"
          className="text-sm font-medium cursor-pointer"
          onClick={() => router.push("/dashboard/requests")}
        >
          Requests
        </Button>
        <Button
          variant="ghost"
          className="text-sm font-medium cursor-pointer"
          onClick={() => router.push("/businesses")}
        >
          Businesses
        </Button>
        <Button
          variant="ghost"
          className="text-sm font-medium cursor-pointer"
          onClick={() => router.push("/dashboard/chat")}
        >
          Chats
        </Button>
      </div>
      <div className="flex items-center gap-4">
        <ThemeToggle/>
        <NotificationBell user={profile} />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-8 w-8 rounded-full p-0 hover:cursor-pointer"
            >
              <Avatar className="h-8 w-8">
                {profile.avatar_url ? (
                  <AvatarImage
                    src={profile.avatar_url}
                    alt={profile.name || "User"}
                  />
                ) : (
                  <AvatarFallback className="bg-primary/10">
                    {profile.name?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                )}
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {profile.name || "User"}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {profile.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => router.push("/dashboard/profile")}
              className="cursor-pointer"
            >

              Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push("/business/dashboard")}
              className="cursor-pointer"
            >
              My Business
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push("/dashboard/profile/change-password")}
              className="cursor-pointer"
            >
              Change Password
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive cursor-pointer"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-14 left-0 right-0 bg-background border-b shadow-lg z-50 w-fit">
          <nav className="flex flex-col p-4 space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start cursor-pointer"
              onClick={() => router.push("/dashboard/items")}
            >
              Sell Items
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start cursor-pointer"
              onClick={() => router.push("/dashboard/requests")}
            >
              Requests
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start cursor-pointer"
              onClick={() => router.push("/businesses")}
            >
              Businesses
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start cursor-pointer"
              onClick={() => router.push("/business/dashboard")}
            >
              My Business
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start cursor-pointer"
              onClick={() => router.push("/dashboard/chat")}
            >
              Chats
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start cursor-pointer"
              onClick={() => router.push("/dashboard/profile")}
            >
              Profile
            </Button>
            <Button
              variant="destructive"
              className="w-fit justify-start cursor-pointer"
              onClick={handleLogout}
            >
              Log out
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}
