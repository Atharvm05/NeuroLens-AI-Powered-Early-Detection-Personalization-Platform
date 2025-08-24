import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ChatInterface } from "@/components/chat/chat-interface"

export default async function ChatPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch recent conversations
  const { data: conversations } = await supabase
    .from("ai_conversations")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(50)

  return (
    <div className="min-h-screen bg-background">
      <ChatInterface user={user} initialConversations={conversations || []} />
    </div>
  )
}
