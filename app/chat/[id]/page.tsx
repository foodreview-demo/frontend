import { ChatClient } from "./chat-client"

export function generateStaticParams() {
  // Static export에서는 최소 하나의 경로가 필요
  // 실제 데이터는 클라이언트에서 API를 통해 로드
  return [{ id: "1" }]
}

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ChatClient id={id} />
}
