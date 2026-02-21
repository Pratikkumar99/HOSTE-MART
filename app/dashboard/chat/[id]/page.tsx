// app/(dashboard)/chat/[id]/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ChatWindow } from '@/components/chat/chat-window'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function ChatRoomPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient()
  const { id } = await params
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verify user has access to this chat room
  const { data: chatRoom } = await supabase
    .from('chat_rooms')
    .select('*')
    .eq('id', id)
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .single()

  if (!chatRoom) {
    redirect('/dashboard/chat')
  }

  return (
    <div className="h-full">
      <div className="mb-6">
        <Link
          href="/dashboard/chat"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-400"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Chats
        </Link>
      </div>

      <div className="bg-white rounded-xl border h-full dark:bg-black/30">
        <ChatWindow chatRoomId={id} currentUserId={user.id} />
      </div>
    </div>
  )
}