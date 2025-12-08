"use client"

import { use, useState, useRef, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Send, MapPin, MoreVertical } from "lucide-react"
import { MobileLayout } from "@/components/mobile-layout"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { mockUsers, currentUser } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

export function generateStaticParams() {
  return mockUsers.map((user) => ({
    id: user.id,
  }))
}

interface Message {
  id: string
  senderId: string
  content: string
  createdAt: Date
}

function getTasteLevel(score: number): { label: string; color: string } {
  if (score >= 2000) return { label: "마스터", color: "bg-primary text-primary-foreground" }
  if (score >= 1500) return { label: "전문가", color: "bg-accent text-accent-foreground" }
  if (score >= 1000) return { label: "미식가", color: "bg-secondary text-secondary-foreground" }
  if (score >= 500) return { label: "탐험가", color: "bg-muted text-muted-foreground" }
  return { label: "입문자", color: "bg-muted text-muted-foreground" }
}

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      senderId: id,
      content: "안녕하세요! 마포구 맛집 정보 공유하고 싶어서 연락드렸어요 😊",
      createdAt: new Date(Date.now() - 3600000 * 2),
    },
    {
      id: "2",
      senderId: currentUser.id,
      content: "반가워요! 마포구에 자주 가시나요?",
      createdAt: new Date(Date.now() - 3600000 * 1.5),
    },
    {
      id: "3",
      senderId: id,
      content: "네! 연남동, 망원동 쪽 자주 다녀요. 혹시 추천해주실 곳 있으신가요?",
      createdAt: new Date(Date.now() - 3600000),
    },
    {
      id: "4",
      senderId: currentUser.id,
      content: "망원동에 새로 생긴 파스타집 진짜 맛있더라고요! 리뷰 올려뒀는데 확인해보세요",
      createdAt: new Date(Date.now() - 1800000),
    },
  ])
  const [newMessage, setNewMessage] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const otherUser = mockUsers.find((u) => u.id === id) || mockUsers[1]
  const level = getTasteLevel(otherUser.tasteScore)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = () => {
    if (!newMessage.trim()) return

    const message: Message = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      content: newMessage.trim(),
      createdAt: new Date(),
    }

    setMessages([...messages, message])
    setNewMessage("")

    // Simulate reply after 1 second
    setTimeout(() => {
      const replies = [
        "오 좋은 정보 감사해요!",
        "저도 다음에 꼭 가볼게요 👍",
        "혹시 그 근처에 다른 추천 맛집도 있나요?",
        "리뷰 봤어요! 맛있어 보이네요~",
      ]
      const randomReply = replies[Math.floor(Math.random() * replies.length)]

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          senderId: id,
          content: randomReply,
          createdAt: new Date(),
        },
      ])
    }, 1000)
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <MobileLayout>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link href="/friends">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <Link href={`/profile/${otherUser.id}`} className="flex items-center gap-3 flex-1">
            <Avatar className="h-10 w-10">
              <AvatarImage src={otherUser.avatar || "/placeholder.svg"} alt={otherUser.name} />
              <AvatarFallback>{otherUser.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">{otherUser.name}</span>
                <Badge variant="secondary" className={cn("text-xs", level.color)}>
                  {level.label}
                </Badge>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>{otherUser.region}</span>
              </div>
            </div>
          </Link>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 p-4 space-y-4 pb-24 overflow-y-auto">
        {/* Date Divider */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">오늘</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {messages.map((message) => {
          const isMe = message.senderId === currentUser.id
          return (
            <div key={message.id} className={cn("flex gap-2", isMe ? "justify-end" : "justify-start")}>
              {!isMe && (
                <Avatar className="h-8 w-8">
                  <AvatarImage src={otherUser.avatar || "/placeholder.svg"} alt={otherUser.name} />
                  <AvatarFallback>{otherUser.name[0]}</AvatarFallback>
                </Avatar>
              )}
              <div className={cn("max-w-[70%]", isMe ? "items-end" : "items-start")}>
                <div
                  className={cn(
                    "px-4 py-2 rounded-2xl",
                    isMe
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-secondary text-secondary-foreground rounded-tl-sm",
                  )}
                >
                  <p className="text-sm">{message.content}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1 px-1">{formatTime(message.createdAt)}</p>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-md bg-card border-t border-border p-4">
        <div className="flex gap-2">
          <Input
            placeholder="메시지를 입력하세요"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={!newMessage.trim()} className="bg-primary text-primary-foreground">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </MobileLayout>
  )
}
