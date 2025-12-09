import { mockUsers } from "@/lib/mock-data"
import { ChatClient } from "./chat-client"

export function generateStaticParams() {
  return mockUsers.map((user) => ({
    id: user.id,
  }))
}

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ChatClient id={id} />
}
