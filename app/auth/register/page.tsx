// app/(auth)/register/page.tsx
import { RegisterForm } from '@/components/auth/register-form'
import Link from 'next/link'

export default function RegisterPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-center mb-6">Create Account</h2>
      <RegisterForm />
      <div className="mt-6 text-center text-sm">
        <span className="text-gray-600">Already have an account? </span>
        <Link href="/login" className="text-primary font-semibold hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  )
}