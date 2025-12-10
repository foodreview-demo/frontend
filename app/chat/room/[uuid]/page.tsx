import { ChatRoomClient } from "./chat-room-client"

export function generateStaticParams() {
  // UUID는 미리 알 수 없으므로, 빌드 시점에는 빈 배열 반환
  // S3에서 404 리다이렉트 설정으로 처리하거나,
  // 친구 페이지에서 채팅방 생성 후 리다이렉트 방식 사용
  return [{ uuid: "placeholder" }]
}

export default async function ChatRoomPage({ params }: { params: Promise<{ uuid: string }> }) {
  const { uuid } = await params
  return <ChatRoomClient uuid={uuid} />
}
