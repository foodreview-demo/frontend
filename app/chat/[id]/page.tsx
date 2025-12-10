import { ChatClient } from "./chat-client"

export function generateStaticParams() {
  // Static export에서는 모든 가능한 경로를 미리 생성해야 함
  // 1~100까지 ID 생성 (필요에 따라 확장 가능)
  return Array.from({ length: 100 }, (_, i) => ({ id: String(i + 1) }))
}

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ChatClient id={id} />
}
