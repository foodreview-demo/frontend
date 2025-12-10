"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Send, MapPin, MoreVertical, Loader2 } from "lucide-react"
import { MobileLayout } from "@/components/mobile-layout"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { api, User, ChatMessage, ChatRoom } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"

function getTasteLevel(score: number): { label: string; color: string } {
  if (score >= 2000) return { label: "마스터", color: "bg-primary text-primary-foreground" }
  if (score >= 1500) return { label: "전문가", color: "bg-accent text-accent-foreground" }
  if (score >= 1000) return { label: "미식가", color: "bg-secondary text-secondary-foreground" }
  if (score >= 500) return { label: "탐험가", color: "bg-muted text-muted-foreground" }
  return { label: "입문자", color: "bg-muted text-muted-foreground" }
}

export function ChatClient({ id }: { id: string }) {
  const { user: currentUser } = useAuth()
  const [otherUser, setOtherUser] = useState<User | null>(null)
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const userId = Number(id)

        // Get other user info
        const userResult = await api.getUser(userId)
        if (userResult.success) {
          setOtherUser(userResult.data)
        }

        // Get or create chat room
        const roomResult = await api.getOrCreateChatRoom(userId)
        if (roomResult.success) {
          setChatRoom(roomResult.data)

          // Get messages
          const messagesResult = await api.getMessages(roomResult.data.id)
          if (messagesResult.success) {
            setMessages(messagesResult.data.content.reverse()) // Reverse to show oldest first
          }
        }
      } catch (err) {
        console.error("채팅 로드 실패:", err)
        setError("채팅을 불러오는데 실패했습니다")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!newMessage.trim() || !chatRoom || isSending) return

    setIsSending(true)
    const messageContent = newMessage.trim()
    setNewMessage("")

    try {
      const result = await api.sendMessage(chatRoom.id, messageContent)
      if (result.success) {
        setMessages([...messages, result.data])
      }
    } catch (err) {
      console.error("메시지 전송 실패:", err)
      alert("메시지 전송에 실패했습니다")
      setNewMessage(messageContent) // Restore message on failure
    } finally {
      setIsSending(false)
    }
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (isLoading) {
    return (
      <MobileLayout>
        <div className="flex justify-center items-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MobileLayout>
    )
  }

  if (error || !otherUser) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <p className="text-muted-foreground">{error || "사용자를 찾을 수 없습니다"}</p>
          <Link href="/friends">
            <Button className="mt-4">돌아가기</Button>
          </Link>
        </div>
      </MobileLayout>
    )
  }

  const level = getTasteLevel(otherUser.tasteScore)

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
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">아직 대화가 없습니다</p>
            <p className="text-sm text-muted-foreground mt-1">먼저 인사해보세요!</p>
          </div>
        ) : (
          <>
            {/* Date Divider */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">오늘</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {messages.map((message) => {
              const isMe = message.isMine
              return (
                <div key={message.id} className={cn("flex gap-2", isMe ? "justify-end" : "justify-start")}>
                  {!isMe && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={message.senderAvatar || "/placeholder.svg"} alt={message.senderName} />
                      <AvatarFallback>{message.senderName[0]}</AvatarFallback>
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
          </>
        )}
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
            disabled={isSending}
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending}
            className="bg-primary text-primary-foreground"
          >
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </MobileLayout>
  )
}
