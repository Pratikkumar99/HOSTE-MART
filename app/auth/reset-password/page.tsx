// app/auth/reset-password/page.tsx
'use client'

import { useSearchParams } from 'next/navigation'
import { ResetPasswordForm } from '@/components/auth/reset-password-form'

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token_hash')

  if (!token) {
    return (
      <div className="text-center p-8">
        <div className="rounded-md bg-yellow-50 p-4">
          <p className="text-yellow-800">Invalid or missing reset token</p>
          <a 
            href="/forgot-password" 
            className="text-primary hover:underline mt-2 inline-block"
          >
            Request a new reset link
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-center mb-6">Choose a new password</h2>
      <ResetPasswordForm token={token} />
    </div>
  )
}