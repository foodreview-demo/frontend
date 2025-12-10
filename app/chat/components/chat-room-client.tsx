"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Send, MapPin, Loader2, MoreVertical, Check, CheckCheck } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { api, ChatMessage, ChatRoom } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { useChatSocket, ReadNotification } from "@/lib/use-chat-socket"
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
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // WebSocket 연결 상태에서 수신된 메시지 처리
  const handleWebSocketMessage = useCallback((message: ChatMessage) => {
    // 내가 보낸 메시지는 이미 optimistic update로 추가됨 - 무시
    if (message.senderId === currentUser?.id) {
      return
    }

    setMessages((prev) => {
      // 중복 메시지 방지
      if (prev.some((m) => m.id === message.id)) {
        return prev
      }
      return [...prev, message]
    })
  }, [currentUser?.id])

  // 읽음 알림 수신 처리 - 내가 보낸 메시지들을 읽음으로 표시
  const handleReadNotification = useCallback((notification: ReadNotification) => {
    // 상대방이 읽었을 때만 처리 (내가 읽은 건 무시)
    if (notification.readByUserId === currentUser?.id) return

    setMessages((prev) =>
      prev.map((msg) => {
        // 내가 보낸 메시지이고 아직 읽지 않은 경우 읽음으로 변경
        if (msg.senderId === currentUser?.id && !msg.isRead) {
          return { ...msg, isRead: true }
        }
        return msg
      })
    )
  }, [currentUser?.id])

  // WebSocket 연결
  const { isConnected, sendMessage: sendWebSocketMessage, sendReadNotification } = useChatSocket({
    roomUuid: uuid,
    userId: currentUser?.id || 0,
    onMessage: handleWebSocketMessage,
    onReadNotification: handleReadNotification,
    enabled: !!currentUser && uuid !== "placeholder",
  })

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  // 초기 데이터 로드
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

          // Get messages - 정렬은 서버에서 ASC로 옴
          const messagesResult = await api.getMessagesByUuid(uuid)
          if (messagesResult.success) {
            // 서버에서 오래된 순으로 정렬되어 오므로 그대로 사용
            setMessages(messagesResult.data.content)
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

  // 메시지 변경 시 스크롤
  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // WebSocket 연결 시 읽음 알림 전송 (최초 1회)
  const hasNotifiedRead = useRef(false)
  useEffect(() => {
    if (isConnected && !hasNotifiedRead.current) {
      // 채팅방 입장 시 읽음 알림 전송
      sendReadNotification()
      hasNotifiedRead.current = true
    }
  }, [isConnected, sendReadNotification])

  // 새 메시지 수신 시 읽음 알림 전송 (상대방 메시지인 경우)
  const prevMessagesLengthRef = useRef(0)
  useEffect(() => {
    if (isConnected && messages.length > prevMessagesLengthRef.current) {
      const lastMessage = messages[messages.length - 1]
      // 상대방이 보낸 새 메시지가 있으면 읽음 알림 전송
      if (lastMessage && lastMessage.senderId !== currentUser?.id) {
        sendReadNotification()
      }
    }
    prevMessagesLengthRef.current = messages.length
  }, [isConnected, messages, currentUser?.id, sendReadNotification])

  // 메시지 전송
  const handleSend = async () => {
    if (!newMessage.trim() || !chatRoom || isSending || !currentUser) return

    const messageContent = newMessage.trim()
    setNewMessage("")
    setIsSending(true)

    // WebSocket으로 전송 시도
    if (isConnected) {
      const sent = sendWebSocketMessage(messageContent)
      if (sent) {
        // Optimistic update - WebSocket으로 전송 성공 시
        const optimisticMessage: ChatMessage = {
          id: Date.now(),
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderAvatar: currentUser.avatar || "",
          content: messageContent,
          createdAt: new Date().toISOString(),
          isRead: false,
          isMine: true,
        }
        setMessages((prev) => [...prev, optimisticMessage])
        setIsSending(false)
        textareaRef.current?.focus()
        return
      }
    }

    // WebSocket 연결이 안 되어 있으면 REST API로 fallback
    try {
      const result = await api.sendMessageByUuid(uuid, messageContent)
      if (result.success) {
        setMessages((prev) => [...prev, result.data])
      }
    } catch (err) {
      console.error("메시지 전송 실패:", err)
      setNewMessage(messageContent)
      alert("메시지 전송에 실패했습니다")
    } finally {
      setIsSending(false)
      textareaRef.current?.focus()
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

  const handleLeaveChat = async () => {
    if (!confirm("채팅방을 나가시겠습니까? 모든 대화 내용이 삭제됩니다.")) {
      return
    }

    try {
      await api.leaveChatRoom(uuid)
      router.push("/friends")
    } catch (err) {
      console.error("채팅방 나가기 실패:", err)
      alert("채팅방 나가기에 실패했습니다")
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto">
        <div className="flex justify-center items-center flex-1">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (error || !chatRoom) {
    return (
      <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto">
        <div className="flex flex-col items-center justify-center flex-1 p-4">
          <p className="text-muted-foreground">{error || "채팅방을 찾을 수 없습니다"}</p>
          <Link href="/friends">
            <Button className="mt-4">돌아가기</Button>
          </Link>
        </div>
      </div>
    )
  }

  const otherUser = chatRoom.otherUser
  const level = getTasteLevel(otherUser.tasteScore)
  const messageGroups = groupMessagesByDate(messages)

  return (
    <div className="min-h-screen bg-secondary/30 flex flex-col max-w-md mx-auto">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border px-2 py-2">
        <div className="flex items-center gap-2">
          <Link href="/friends">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <Link href={`/profile/${otherUser.id}`} className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar className="h-9 w-9">
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/profile/${otherUser.id}`}>프로필 보기</Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={handleLeaveChat}>
                채팅방 나가기
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Avatar className="h-20 w-20 mb-4 ring-4 ring-primary/20">
              <AvatarImage src={otherUser.avatar || "/placeholder.svg"} alt={otherUser.name} />
              <AvatarFallback className="text-2xl bg-primary/10">{otherUser.name[0]}</AvatarFallback>
            </Avatar>
            <p className="text-foreground font-semibold text-lg">{otherUser.name}</p>
            <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
              <MapPin className="h-3 w-3" />
              <span>{otherUser.region}</span>
            </div>
            <p className="text-muted-foreground text-sm mt-4">대화를 시작해보세요!</p>
          </div>
        ) : (
          messageGroups.map((group, groupIndex) => (
            <div key={groupIndex}>
              {/* Date Divider */}
              <div className="flex justify-center my-4">
                <span className="text-xs text-muted-foreground bg-secondary px-3 py-1 rounded-full">
                  {group.date}
                </span>
              </div>

              {/* Messages */}
              {group.messages.map((message, messageIndex) => {
                // senderId로 직접 비교 (WebSocket 브로드캐스트 시 isMine이 sender 기준으로만 설정되므로)
                const isMe = message.senderId === currentUser?.id
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
                      isGroupedWithPrev ? "mt-1" : "mt-3"
                    )}
                  >
                    {/* Avatar */}
                    {!isMe && !isGroupedWithPrev && (
                      <Link href={`/profile/${otherUser.id}`}>
                        <Avatar className="h-8 w-8 mt-1">
                          <AvatarImage src={message.senderAvatar || "/placeholder.svg"} alt={message.senderName} />
                          <AvatarFallback className="text-xs">{message.senderName[0]}</AvatarFallback>
                        </Avatar>
                      </Link>
                    )}

                    {!isMe && isGroupedWithPrev && <div className="w-8" />}

                    {/* Message Content */}
                    <div className={cn("flex flex-col max-w-[75%]", isMe ? "items-end" : "items-start")}>
                      {!isMe && !isGroupedWithPrev && (
                        <span className="text-xs text-muted-foreground mb-1 ml-1">{message.senderName}</span>
                      )}

                      <div className={cn("flex items-end gap-1.5", isMe && "flex-row-reverse")}>
                        <div
                          className={cn(
                            "px-3 py-2 rounded-2xl break-words shadow-sm",
                            isMe
                              ? "bg-primary text-primary-foreground rounded-br-md"
                              : "bg-card text-card-foreground border border-border rounded-bl-md"
                          )}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>

                        {showTime && (
                          <div className={cn("flex items-center gap-0.5 mb-1", isMe && "flex-row-reverse")}>
                            {/* 읽음 표시 - 내 메시지에만 표시 */}
                            {isMe && (
                              message.isRead ? (
                                <CheckCheck className="h-3 w-3 text-blue-500" />
                              ) : (
                                <Check className="h-3 w-3 text-muted-foreground" />
                              )
                            )}
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                              {formatTime(message.createdAt)}
                            </span>
                          </div>
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
      <div className="sticky bottom-0 bg-card px-3 py-3 border-t border-border">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Textarea
              ref={textareaRef}
              placeholder="메시지를 입력하세요"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              className="min-h-[40px] max-h-[120px] resize-none rounded-2xl bg-secondary border-0 focus-visible:ring-1 focus-visible:ring-primary py-2.5 px-4"
              disabled={isSending}
              rows={1}
            />
          </div>
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending}
            size="icon"
            className="rounded-full shrink-0 h-10 w-10"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
