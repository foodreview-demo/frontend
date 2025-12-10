"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Send, MapPin, Loader2, Image, Menu } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

// Group messages by date
function groupMessagesByDate(messages: ChatMessage[]) {
  const groups: { date: string; messages: ChatMessage[] }[] = []
  let currentDate = ""

  messages.forEach((message) => {
    const messageDate = new Date(message.createdAt).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    })

    if (messageDate !== currentDate) {
      currentDate = messageDate
      groups.push({ date: messageDate, messages: [message] })
    } else {
      groups[groups.length - 1].messages.push(message)
    }
  })

  return groups
}

// Check if messages should be grouped (same sender, within 1 minute)
function shouldGroupWithPrevious(current: ChatMessage, previous: ChatMessage | null) {
  if (!previous) return false
  if (current.senderId !== previous.senderId) return false

  const currentTime = new Date(current.createdAt).getTime()
  const previousTime = new Date(previous.createdAt).getTime()
  return currentTime - previousTime < 60000 // 1 minute
}

export function ChatRoomClient({ uuid }: { uuid: string }) {
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      if (uuid === "placeholder") {
        setError("잘못된 접근입니다")
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)
      try {
        // Get chat room info by UUID
        const roomResult = await api.getChatRoomByUuid(uuid)
        if (roomResult.success) {
          setChatRoom(roomResult.data)

          // Get messages
          const messagesResult = await api.getMessagesByUuid(uuid)
          if (messagesResult.success) {
            setMessages(messagesResult.data.content.reverse())
          }
        }
      } catch (err) {
        console.error("채팅 로드 실패:", err)
        setError("채팅방을 불러오는데 실패했습니다")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [uuid])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Poll for new messages every 3 seconds
  useEffect(() => {
    if (!chatRoom || uuid === "placeholder") return

    const pollMessages = async () => {
      try {
        const messagesResult = await api.getMessagesByUuid(uuid)
        if (messagesResult.success) {
          setMessages(messagesResult.data.content.reverse())
        }
      } catch (err) {
        console.error("메시지 폴링 실패:", err)
      }
    }

    const interval = setInterval(pollMessages, 3000)
    return () => clearInterval(interval)
  }, [chatRoom, uuid])

  const handleSend = async () => {
    if (!newMessage.trim() || !chatRoom || isSending) return

    setIsSending(true)
    const messageContent = newMessage.trim()
    setNewMessage("")

    // Optimistic update
    const optimisticMessage: ChatMessage = {
      id: Date.now(),
      senderId: currentUser?.id || 0,
      senderName: currentUser?.name || "",
      senderAvatar: currentUser?.avatar || "",
      content: messageContent,
      createdAt: new Date().toISOString(),
      isRead: false,
      isMine: true,
    }
    setMessages((prev) => [...prev, optimisticMessage])

    try {
      const result = await api.sendMessageByUuid(uuid, messageContent)
      if (result.success) {
        setMessages((prev) =>
          prev.map((m) => (m.id === optimisticMessage.id ? result.data : m))
        )
      }
    } catch (err) {
      console.error("메시지 전송 실패:", err)
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMessage.id))
      setNewMessage(messageContent)
      alert("메시지 전송에 실패했습니다")
    } finally {
      setIsSending(false)
      inputRef.current?.focus()
    }
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#b2c7d9] flex flex-col max-w-md mx-auto">
        <div className="flex justify-center items-center flex-1">
          <Loader2 className="w-8 h-8 animate-spin text-white" />
        </div>
      </div>
    )
  }

  if (error || !chatRoom) {
    return (
      <div className="min-h-screen bg-[#b2c7d9] flex flex-col max-w-md mx-auto">
        <div className="flex flex-col items-center justify-center flex-1 p-4">
          <p className="text-white">{error || "채팅방을 찾을 수 없습니다"}</p>
          <Link href="/friends">
            <Button className="mt-4 bg-white text-gray-800 hover:bg-gray-100">돌아가기</Button>
          </Link>
        </div>
      </div>
    )
  }

  const otherUser = chatRoom.otherUser
  const level = getTasteLevel(otherUser.tasteScore)
  const messageGroups = groupMessagesByDate(messages)

  return (
    <div className="min-h-screen bg-[#b2c7d9] flex flex-col max-w-md mx-auto">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#b2c7d9] px-2 py-2">
        <div className="flex items-center gap-2">
          <Link href="/friends">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white text-lg">{otherUser.name}</span>
              <Badge variant="secondary" className={cn("text-xs", level.color)}>
                {level.label}
              </Badge>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/profile/${otherUser.id}`}>프로필 보기</Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">채팅방 나가기</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Avatar className="h-20 w-20 mb-4">
              <AvatarImage src={otherUser.avatar || "/placeholder.svg"} alt={otherUser.name} />
              <AvatarFallback className="text-2xl">{otherUser.name[0]}</AvatarFallback>
            </Avatar>
            <p className="text-white font-medium text-lg">{otherUser.name}</p>
            <div className="flex items-center gap-1 text-white/70 text-sm mt-1">
              <MapPin className="h-3 w-3" />
              <span>{otherUser.region}</span>
            </div>
            <p className="text-white/60 text-sm mt-4">대화를 시작해보세요!</p>
          </div>
        ) : (
          messageGroups.map((group, groupIndex) => (
            <div key={groupIndex}>
              {/* Date Divider */}
              <div className="flex justify-center my-4">
                <span className="text-xs text-white/70 bg-black/10 px-3 py-1 rounded-full">
                  {group.date}
                </span>
              </div>

              {/* Messages */}
              {group.messages.map((message, messageIndex) => {
                const isMe = message.isMine
                const prevMessage = messageIndex > 0 ? group.messages[messageIndex - 1] : null
                const nextMessage = messageIndex < group.messages.length - 1 ? group.messages[messageIndex + 1] : null
                const isGroupedWithPrev = shouldGroupWithPrevious(message, prevMessage)
                const isGroupedWithNext = nextMessage && shouldGroupWithPrevious(nextMessage, message)
                const showTime = !isGroupedWithNext

                return (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-2",
                      isMe ? "justify-end" : "justify-start",
                      isGroupedWithPrev ? "mt-0.5" : "mt-3"
                    )}
                  >
                    {/* Avatar */}
                    {!isMe && !isGroupedWithPrev && (
                      <Link href={`/profile/${otherUser.id}`}>
                        <Avatar className="h-9 w-9 mt-1">
                          <AvatarImage src={message.senderAvatar || "/placeholder.svg"} alt={message.senderName} />
                          <AvatarFallback>{message.senderName[0]}</AvatarFallback>
                        </Avatar>
                      </Link>
                    )}

                    {!isMe && isGroupedWithPrev && <div className="w-9" />}

                    {/* Message Content */}
                    <div className={cn("flex flex-col max-w-[70%]", isMe ? "items-end" : "items-start")}>
                      {!isMe && !isGroupedWithPrev && (
                        <span className="text-xs text-white/70 mb-1 ml-1">{message.senderName}</span>
                      )}

                      <div className={cn("flex items-end gap-1", isMe && "flex-row-reverse")}>
                        <div
                          className={cn(
                            "px-3 py-2 rounded-2xl break-words",
                            isMe
                              ? "bg-[#fee500] text-gray-900 rounded-br-sm"
                              : "bg-white text-gray-900 rounded-bl-sm"
                          )}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>

                        {showTime && (
                          <span className="text-[10px] text-white/60 mb-1 whitespace-nowrap">
                            {formatTime(message.createdAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="sticky bottom-0 bg-white px-2 py-2 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700 shrink-0">
            <Image className="h-6 w-6" />
          </Button>
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              placeholder="메시지 입력"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              className="bg-gray-100 border-0 rounded-full pr-10 focus-visible:ring-0 focus-visible:ring-offset-0"
              disabled={isSending}
            />
          </div>
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending}
            size="icon"
            className={cn(
              "rounded-full shrink-0 transition-colors",
              newMessage.trim()
                ? "bg-[#fee500] hover:bg-[#fdd835] text-gray-900"
                : "bg-gray-200 text-gray-400"
            )}
          >
            {isSending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
