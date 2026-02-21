'use client';

import { useRouter } from 'next/navigation';
import { createClient } from "@/lib/supabase/client";
import { AnimatedSentence } from "@/components/auth/animated-sentence";
import { useEffect, useState } from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Error checking user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();
  }, [router, supabase]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center  p-4 dark:bg-black ">
      <div className="absolute inset-0 -z-10" />
      <div className="absolute top-0">
        <img src="/logo.png" alt="DormAce" className="h-30 w-auto mx-auto invert" />
      </div>
      <div className="w-full max-w-md mt-30">
        <div className="mb-8 text-center">
          <h1>
            <AnimatedSentence text="           Making hostel buying and selling smartly" />
          </h1>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-100 dark:bg-black dark:border-gray-700">
          {children}
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
