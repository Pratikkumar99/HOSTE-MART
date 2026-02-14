// app/(dashboard)/chat/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ChatListFixed } from '@/components/chat/chat-list-fixed'
import { MessageSquare } from 'lucide-react'
import { BackButton } from '@/components/ui/back-button'

export default async function ChatPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="space-y-6">
      <BackButton />
      <div>
        <h1 className="text-3xl font-bold">Chats</h1>
        <p className="text-gray-600 mt-2">
          Connect with buyers and sellers in your hostel
        </p>
      </div>

      <div className="bg-white rounded-xl border">
        <div className="p-6">
          <ChatListFixed userId={user.id} />
        </div>
      </div>
    </div>
  )
}