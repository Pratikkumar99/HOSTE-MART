// app/(auth)/login/page.tsx
import { LoginForm } from '@/components/auth/login-form'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-center mb-6">Welcome Back</h2>
      <LoginForm />
      <div className="mt-6 text-center text-sm">
        <span className="text-gray-600">Don't have an account? </span>
        <Link href="/register" className="text-primary font-semibold hover:underline">
          Sign up
        </Link>
      </div>
    </div>
  )
}