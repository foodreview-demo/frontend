"use client"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { ChatRoomClient } from "./components/chat-room-client"
import { MobileLayout } from "@/components/mobile-layout"
import { Loader2, MessageCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

function ChatContent() {
  const searchParams = useSearchParams()
  const roomUuid = searchParams.get("room")

  if (!roomUuid) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <MessageCircle className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">채팅방을 선택해주세요</p>
          <Link href="/friends">
            <Button>친구 목록으로 이동</Button>
          </Link>
        </div>
      </MobileLayout>
    )
  }

  return <ChatRoomClient uuid={roomUuid} />
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <MobileLayout>
          <div className="flex justify-center items-center min-h-screen">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </MobileLayout>
      }
    >
      <ChatContent />
    </Suspense>
  )
}
