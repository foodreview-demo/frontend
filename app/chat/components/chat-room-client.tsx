"use client"

import { useState, useRef, useEffect, useCallback, TouchEvent, MouseEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Send, MapPin, Loader2, MoreVertical, Check, CheckCheck, Users, UserPlus, X, Flag, UserX, AlertTriangle, Copy, Trash2, Reply } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { api, ChatMessage, ChatRoom, User, ChatReportReason, CHAT_REPORT_REASONS } from "@/lib/api"
import { ChatReportDialog } from "@/components/chat-report-dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useAuth } from "@/lib/auth-context"
import { useChatSocket, ReadNotification } from "@/lib/use-chat-socket"
import { cn } from "@/lib/utils"
import { getTasteLevel } from "@/lib/constants"

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
      timeZone: "Asia/Seoul",
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

  // 초대 모달 관련 상태
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [followingList, setFollowingList] = useState<User[]>([])
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])
  const [isInviting, setIsInviting] = useState(false)

  // 신고/차단 관련 상태
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [showBlockDialog, setShowBlockDialog] = useState(false)
  const [isBlocking, setIsBlocking] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null)
  const [isBlockedError, setIsBlockedError] = useState(false)

  // 답장 관련 상태
  const [replyToMessage, setReplyToMessage] = useState<ChatMessage | null>(null)

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
        // 내가 보낸 메시지만 업데이트
        if (msg.senderId !== currentUser?.id) return msg

        // 단체톡용: 특정 메시지의 읽음 수 업데이트
        if (notification.messageId && notification.readCount !== undefined) {
          if (msg.id === notification.messageId) {
            return {
              ...msg,
              isRead: notification.readCount > 0,
              readCount: notification.readCount
            }
          }
          // 해당 메시지 이전 메시지들도 읽음 수 증가 (최소 같은 readCount)
          if (msg.id < notification.messageId && msg.readCount !== undefined) {
            return {
              ...msg,
              isRead: true,
              readCount: Math.max(msg.readCount, notification.readCount)
            }
          }
        }

        // 1:1 채팅용: 아직 읽지 않은 메시지를 읽음으로 변경
        if (!msg.isRead) {
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
      } catch (err: any) {
        console.error("채팅 로드 실패:", err)
        // 차단된 사용자인 경우 특별 처리
        if (err?.message?.includes("차단") || err?.errorCode === "BLOCKED_USER") {
          setIsBlockedError(true)
          setError("차단된 사용자와는 채팅할 수 없습니다")
        } else {
          setError("채팅방을 불러오는데 실패했습니다")
        }
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

    // 답장인 경우 인용 형식으로 메시지 구성
    let messageContent = newMessage.trim()
    if (replyToMessage) {
      const replyPreview = replyToMessage.content.length > 20
        ? replyToMessage.content.slice(0, 20) + '...'
        : replyToMessage.content
      messageContent = `> ${replyToMessage.senderName}: ${replyPreview}\n\n${messageContent}`
    }

    setNewMessage("")
    setReplyToMessage(null)
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
      timeZone: "Asia/Seoul",
    })
  }

  const handleLeaveChat = async () => {
    if (!confirm("채팅방을 나가시겠습니까? 모든 대화 내용이 삭제됩니다.")) {
      return
    }

    try {
      await api.leaveChatRoom(uuid)
      router.push("/follows")
    } catch (err) {
      console.error("채팅방 나가기 실패:", err)
      alert("채팅방 나가기에 실패했습니다")
    }
  }

  // 초대 모달 열기
  const openInviteModal = async () => {
    if (!currentUser) return
    setIsInviteModalOpen(true)
    try {
      const result = await api.getFollowings(currentUser.id)
      if (result.success) {
        // 이미 채팅방에 있는 멤버 제외
        const memberIds = chatRoom?.members?.map(m => m.user.id) || []
        const filteredList = result.data.content.filter((u: User) => !memberIds.includes(u.id))
        setFollowingList(filteredList)
      }
    } catch (err) {
      console.error("팔로잉 목록 로드 실패:", err)
    }
  }

  // 초대할 사용자 선택/해제
  const toggleUserSelection = (user: User) => {
    setSelectedUsers((prev) => {
      const isSelected = prev.some((u) => u.id === user.id)
      if (isSelected) {
        return prev.filter((u) => u.id !== user.id)
      }
      return [...prev, user]
    })
  }

  // 초대 실행
  const handleInvite = async () => {
    if (selectedUsers.length === 0) return
    setIsInviting(true)
    try {
      const userIds = selectedUsers.map((u) => u.id)
      const result = await api.inviteToRoom(uuid, userIds)
      if (result.success) {
        setChatRoom(result.data)
        setIsInviteModalOpen(false)
        setSelectedUsers([])
      } else {
        alert("초대에 실패했습니다")
      }
    } catch (err) {
      console.error("초대 실패:", err)
      alert("초대에 실패했습니다")
    } finally {
      setIsInviting(false)
    }
  }

  // 사용자 차단
  const handleBlock = async () => {
    // 차단할 사용자 ID: 선택된 메시지가 있으면 메시지 발신자, 없으면 채팅방 상대방
    const blockUserId = selectedMessage?.senderId || chatRoom?.otherUser?.id
    if (!blockUserId) return
    setIsBlocking(true)
    try {
      await api.blockUser(blockUserId)
      // 페이지 이동 전에 다이얼로그 닫기
      setShowBlockDialog(false)
      setSelectedMessage(null)
      // 페이지 이동 (이후 상태 업데이트 하지 않음)
      router.push("/follows")
      // 약간의 딜레이 후 alert (페이지 이동 중 표시)
      setTimeout(() => alert("사용자를 차단했습니다"), 100)
    } catch (err) {
      console.error("차단 실패:", err)
      alert("차단에 실패했습니다")
      setIsBlocking(false)
    }
    // 성공 시에는 페이지 이동하므로 setIsBlocking(false) 호출 안함
  }

  // Long press 관련 ref
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const longPressTriggeredRef = useRef(false)

  // 메시지 길게 누르기 핸들러
  const handleMessageLongPress = (message: ChatMessage) => {
    if (!message.senderId) return // 시스템 메시지 무시
    setSelectedMessage(message)
  }

  // Long press 시작 (터치/마우스)
  const handleLongPressStart = (message: ChatMessage) => {
    if (!message.senderId) return // 시스템 메시지 무시

    longPressTriggeredRef.current = false
    longPressTimerRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true
      handleMessageLongPress(message)
    }, 500) // 500ms 후 long press 인식
  }

  // Long press 종료
  const handleLongPressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }

  // 우클릭 핸들러 (데스크탑)
  const handleContextMenu = (e: MouseEvent, message: ChatMessage) => {
    if (!message.senderId) return // 시스템 메시지 무시

    e.preventDefault()
    handleMessageLongPress(message)
  }

  // 메시지 복사
  const handleCopyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      alert('메시지가 복사되었습니다')
    } catch {
      // fallback for older browsers
      const textarea = document.createElement('textarea')
      textarea.value = content
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      alert('메시지가 복사되었습니다')
    }
    setSelectedMessage(null)
  }

  // 메시지 삭제
  const handleDeleteMessage = async (messageId: number) => {
    if (!confirm('이 메시지를 삭제하시겠습니까?')) return
    try {
      await api.deleteMessage(uuid, messageId)
      setMessages(prev => prev.filter(m => m.id !== messageId))
      setSelectedMessage(null)
    } catch (err) {
      console.error('메시지 삭제 실패:', err)
      alert('메시지 삭제에 실패했습니다')
    }
  }

  // 답장하기
  const handleReply = (message: ChatMessage) => {
    setReplyToMessage(message)
    setSelectedMessage(null)
    textareaRef.current?.focus()
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
        <header className="sticky top-0 z-50 bg-card border-b border-border px-2 py-2">
          <div className="flex items-center gap-2">
            <Link href="/follows">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <span className="font-semibold text-foreground">채팅</span>
          </div>
        </header>
        <div className="flex flex-col items-center justify-center flex-1 p-4">
          {isBlockedError ? (
            <>
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                <UserX className="h-8 w-8 text-destructive" />
              </div>
              <p className="text-lg font-medium text-foreground mb-2">채팅을 할 수 없습니다</p>
              <p className="text-sm text-muted-foreground text-center mb-6">
                차단된 사용자와는 채팅할 수 없습니다.<br />
                차단을 해제하면 다시 대화할 수 있습니다.
              </p>
            </>
          ) : (
            <>
              <p className="text-muted-foreground mb-4">{error || "채팅방을 찾을 수 없습니다"}</p>
            </>
          )}
          <Link href="/follows">
            <Button>채팅 목록으로 돌아가기</Button>
          </Link>
        </div>
      </div>
    )
  }

  const isGroupChat = chatRoom.roomType === 'GROUP'
  const otherUser = chatRoom.otherUser
  const level = otherUser ? getTasteLevel(otherUser.tasteScore) : null
  const messageGroups = groupMessagesByDate(messages)

  // 단체톡 방 이름 표시 (이름이 없으면 멤버 이름 나열)
  const getRoomDisplayName = () => {
    if (!isGroupChat && otherUser) return otherUser.name
    if (chatRoom.name) return chatRoom.name
    if (chatRoom.members && chatRoom.members.length > 0) {
      const names = chatRoom.members
        .filter(m => m.user.id !== currentUser?.id)
        .slice(0, 3)
        .map(m => m.user.name)
      if (chatRoom.memberCount > 4) {
        return `${names.join(', ')} 외 ${chatRoom.memberCount - 4}명`
      }
      return names.join(', ')
    }
    return '단체 채팅방'
  }

  return (
    <div className="min-h-screen bg-secondary/30 flex flex-col max-w-md mx-auto">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border px-2 py-2">
        <div className="flex items-center gap-2">
          <Link href="/follows">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>

          {/* 1:1 채팅 헤더 */}
          {!isGroupChat && otherUser && (
            <Link href={`/profile/${otherUser.id}`} className="flex items-center gap-3 flex-1 min-w-0">
              <Avatar className="h-9 w-9">
                <AvatarImage src={otherUser.avatar || "/placeholder.svg"} alt={otherUser.name} />
                <AvatarFallback>{otherUser.name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{otherUser.name}</span>
                  {level && (
                    <Badge variant="secondary" className={cn("text-xs", level.color)}>
                      {level.label}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>{otherUser.region}</span>
                </div>
              </div>
            </Link>
          )}

          {/* 단체톡 헤더 */}
          {isGroupChat && (
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground truncate">{getRoomDisplayName()}</span>
                  <Badge variant="secondary" className="text-xs">
                    {chatRoom.memberCount}명
                  </Badge>
                </div>
              </div>
            </div>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!isGroupChat && otherUser && (
                <DropdownMenuItem asChild>
                  <Link href={`/profile/${otherUser.id}`}>프로필 보기</Link>
                </DropdownMenuItem>
              )}
              {isGroupChat && (
                <DropdownMenuItem onClick={openInviteModal}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  초대하기
                </DropdownMenuItem>
              )}
              {!isGroupChat && otherUser && (
                <>
                  <DropdownMenuItem onClick={() => setShowReportDialog(true)}>
                    <Flag className="h-4 w-4 mr-2" />
                    신고하기
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" onClick={() => setShowBlockDialog(true)}>
                    <UserX className="h-4 w-4 mr-2" />
                    차단하기
                  </DropdownMenuItem>
                </>
              )}
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
            {!isGroupChat && otherUser ? (
              <>
                <Avatar className="h-20 w-20 mb-4 ring-4 ring-primary/20">
                  <AvatarImage src={otherUser.avatar || "/placeholder.svg"} alt={otherUser.name} />
                  <AvatarFallback className="text-2xl bg-primary/10">{otherUser.name[0]}</AvatarFallback>
                </Avatar>
                <p className="text-foreground font-semibold text-lg">{otherUser.name}</p>
                <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
                  <MapPin className="h-3 w-3" />
                  <span>{otherUser.region}</span>
                </div>
              </>
            ) : (
              <>
                <div className="h-20 w-20 mb-4 rounded-full bg-primary/10 flex items-center justify-center ring-4 ring-primary/20">
                  <Users className="h-10 w-10 text-primary" />
                </div>
                <p className="text-foreground font-semibold text-lg">{getRoomDisplayName()}</p>
                <p className="text-muted-foreground text-sm mt-1">{chatRoom.memberCount}명 참여</p>
              </>
            )}
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
                // 시스템 메시지 처리
                const isSystemMessage = message.messageType === 'SYSTEM'
                if (isSystemMessage) {
                  return (
                    <div key={message.id} className="flex justify-center my-3">
                      <span className="text-xs text-muted-foreground bg-secondary/70 px-3 py-1.5 rounded-full">
                        {message.content}
                      </span>
                    </div>
                  )
                }

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
                    {!isMe && !isGroupedWithPrev && message.senderId && (
                      <Link href={`/profile/${message.senderId}`}>
                        <Avatar className="h-8 w-8 mt-1">
                          <AvatarImage src={message.senderAvatar || "/placeholder.svg"} alt={message.senderName || ''} />
                          <AvatarFallback className="text-xs">{message.senderName?.[0] || '?'}</AvatarFallback>
                        </Avatar>
                      </Link>
                    )}

                    {!isMe && isGroupedWithPrev && <div className="w-8" />}

                    {/* Message Content */}
                    <div className={cn("flex flex-col max-w-[75%]", isMe ? "items-end" : "items-start")}>
                      {!isMe && !isGroupedWithPrev && message.senderName && (
                        <span className="text-xs text-muted-foreground mb-1 ml-1">{message.senderName}</span>
                      )}

                      <div className={cn("flex items-end gap-1.5", isMe && "flex-row-reverse")}>
                        <div
                          className={cn(
                            "px-3 py-2 rounded-2xl break-words shadow-sm select-none cursor-pointer active:opacity-80",
                            isMe
                              ? "bg-primary text-primary-foreground rounded-br-md"
                              : "bg-card text-card-foreground border border-border rounded-bl-md"
                          )}
                          onTouchStart={() => handleLongPressStart(message)}
                          onTouchEnd={handleLongPressEnd}
                          onTouchCancel={handleLongPressEnd}
                          onMouseDown={() => handleLongPressStart(message)}
                          onMouseUp={handleLongPressEnd}
                          onMouseLeave={handleLongPressEnd}
                          onContextMenu={(e) => handleContextMenu(e, message)}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>

                        {showTime && (
                          <div className={cn("flex items-center gap-0.5 mb-1", isMe && "flex-row-reverse")}>
                            {/* 단체톡: 안 읽은 사람 수 표시 */}
                            {isGroupChat && message.memberCount !== undefined && message.memberCount > 0 && (
                              <div className="flex items-center gap-0.5">
                                {(() => {
                                  const unreadCount = message.memberCount - (message.readCount || 0)
                                  if (unreadCount > 0) {
                                    return (
                                      <span className="text-[10px] text-primary font-medium">
                                        {unreadCount}
                                      </span>
                                    )
                                  }
                                  return null
                                })()}
                              </div>
                            )}
                            {/* 1:1 채팅: 내 메시지에만 읽음 표시 */}
                            {!isGroupChat && isMe && (
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
      <div className="sticky bottom-0 bg-card border-t border-border">
        {/* 답장 프리뷰 */}
        {replyToMessage && (
          <div className="px-3 pt-2 pb-1 flex items-center gap-2 bg-secondary/50">
            <Reply className="h-4 w-4 text-primary shrink-0" />
            <div className="flex-1 min-w-0 text-sm">
              <span className="text-primary font-medium">{replyToMessage.senderName}</span>
              <span className="text-muted-foreground ml-1">
                {replyToMessage.content.length > 30
                  ? replyToMessage.content.slice(0, 30) + '...'
                  : replyToMessage.content}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={() => setReplyToMessage(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        <div className="px-3 py-3 flex items-end gap-2">
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

      {/* 초대 모달 */}
      <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
        <DialogContent className="max-w-md max-h-[70vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>멤버 초대하기</DialogTitle>
          </DialogHeader>

          {selectedUsers.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                선택된 멤버 ({selectedUsers.length}명)
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map((user) => (
                  <Badge
                    key={user.id}
                    variant="secondary"
                    className="pl-2 pr-1 py-1 flex items-center gap-1"
                  >
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={user.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="text-[10px]">{user.name[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs">{user.name}</span>
                    <button
                      onClick={() => toggleUserSelection(user)}
                      className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <label className="text-sm font-medium text-muted-foreground mb-2">
              팔로잉 목록에서 선택
            </label>
            <div className="flex-1 overflow-y-auto space-y-1 pr-2">
              {followingList.length > 0 ? (
                followingList.map((user) => {
                  const isSelected = selectedUsers.some((u) => u.id === user.id)
                  const level = getTasteLevel(user.tasteScore)
                  return (
                    <div
                      key={user.id}
                      onClick={() => toggleUserSelection(user)}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors",
                        isSelected ? "bg-primary/10 ring-1 ring-primary" : "hover:bg-secondary/50"
                      )}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                        <AvatarFallback className="bg-primary/10 text-primary">{user.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground truncate">{user.name}</span>
                          <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0", level.color)}>
                            {level.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{user.region}</p>
                      </div>
                      <div className={cn(
                        "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors",
                        isSelected ? "bg-primary border-primary" : "border-muted-foreground/30"
                      )}>
                        {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-8">
                  <Users className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">초대할 수 있는 사용자가 없습니다</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" className="flex-1" onClick={() => setIsInviteModalOpen(false)}>
              취소
            </Button>
            <Button
              className="flex-1"
              onClick={handleInvite}
              disabled={selectedUsers.length === 0 || isInviting}
            >
              {isInviting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <UserPlus className="h-4 w-4 mr-2" />
              )}
              {selectedUsers.length === 0 ? "선택해주세요" : `${selectedUsers.length}명 초대`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 신고 다이얼로그 */}
      {chatRoom && (selectedMessage?.senderId || chatRoom.otherUser) && (
        <ChatReportDialog
          open={showReportDialog}
          onOpenChange={setShowReportDialog}
          reportedUserId={selectedMessage?.senderId || chatRoom.otherUser?.id || 0}
          reportedUserName={selectedMessage?.senderName || chatRoom.otherUser?.name || ''}
          chatRoomId={chatRoom.id}
          messageId={selectedMessage?.id}
          messageContent={selectedMessage?.content}
          onSuccess={() => setSelectedMessage(null)}
        />
      )}

      {/* 차단 확인 다이얼로그 */}
      <Dialog open={showBlockDialog} onOpenChange={(open) => {
        setShowBlockDialog(open)
        if (!open) setSelectedMessage(null)
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              사용자 차단
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="text-sm text-muted-foreground">
              <strong>{selectedMessage?.senderName || chatRoom?.otherUser?.name}</strong>님을 차단하시겠습니까?
            </div>
            <ul className="list-disc pl-5 mt-3 space-y-1 text-sm text-muted-foreground">
              <li>이 사용자의 리뷰가 피드에 표시되지 않습니다</li>
              <li>이 사용자의 채팅 메시지를 받을 수 없습니다</li>
              <li>서로 팔로우 관계가 해제됩니다</li>
            </ul>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => {
              setShowBlockDialog(false)
              setSelectedMessage(null)
            }}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleBlock} disabled={isBlocking}>
              {isBlocking ? "차단 중..." : "차단하기"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 메시지 액션 다이얼로그 (메시지 길게 눌렀을 때) */}
      <Dialog open={!!selectedMessage} onOpenChange={(open) => !open && setSelectedMessage(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-base">메시지 옵션</DialogTitle>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-2">
              <div className="p-2 bg-muted rounded text-sm mb-4">
                &ldquo;{selectedMessage.content.length > 50 ? selectedMessage.content.slice(0, 50) + '...' : selectedMessage.content}&rdquo;
              </div>

              {/* 답장 */}
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleReply(selectedMessage)}
              >
                <Reply className="h-4 w-4 mr-2" />
                답장
              </Button>

              {/* 복사 */}
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleCopyMessage(selectedMessage.content)}
              >
                <Copy className="h-4 w-4 mr-2" />
                복사
              </Button>

              {/* 삭제 (내 메시지만) */}
              {selectedMessage.senderId === currentUser?.id && (
                <Button
                  variant="outline"
                  className="w-full justify-start text-destructive hover:text-destructive"
                  onClick={() => handleDeleteMessage(selectedMessage.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  삭제
                </Button>
              )}

              {/* 신고/차단 (상대방 메시지만) */}
              {selectedMessage.senderId !== currentUser?.id && (
                <>
                  <div className="border-t my-2" />
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      setShowReportDialog(true)
                    }}
                  >
                    <Flag className="h-4 w-4 mr-2" />
                    이 메시지 신고하기
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-destructive hover:text-destructive"
                    onClick={() => {
                      setSelectedMessage(null)
                      setShowBlockDialog(true)
                    }}
                  >
                    <UserX className="h-4 w-4 mr-2" />
                    이 사용자 차단하기
                  </Button>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
