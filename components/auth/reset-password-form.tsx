"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useEffect, useState } from "react";

interface ResetPasswordFormProps {
  token?: string | null;
}

export function ResetPasswordForm({ token: propToken }: ResetPasswordFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  
  // Get token from props or URL
  const token = propToken || searchParams.get('token_hash');

  // Verify the token when component mounts
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError("Invalid or missing reset token. Please request a new password reset email.");
        setVerifying(false);
        return;
      }
      setVerifying(false);
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!token) {
      setError("Invalid reset token. Please request a new password reset email.");
      return;
    }

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Validate password length
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. First verify the OTP token
      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'recovery',
      });

      if (verifyError) throw verifyError;

      // 2. Update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) throw updateError;

      // 3. Show success message and redirect
      toast.success("Password updated successfully! Redirecting to login...");
      
      // 4. Sign out any existing sessions
      await supabase.auth.signOut();
      
      // 5. Redirect to login page
      router.push('/login');
    } catch (error: any) {
      console.error("Error updating password:", error);
      setError(error.message || "Failed to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="text-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Verifying your reset link...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 p-4 text-center">
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">{error}</p>
        </div>
        <Button
          onClick={() => (window.location.href = "/forgot-password")}
          className="w-full"
        >
          Request New Reset Link
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">New Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            placeholder="Enter your new password"
            className={error ? "border-red-500" : ""}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            minLength={6}
            placeholder="Confirm your new password"
            className={error ? "border-red-500" : ""}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Updating Password..." : "Update Password"}
      </Button>
    </form>
  );
}