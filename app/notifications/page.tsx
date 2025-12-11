"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Bell, Heart, UserPlus, MessageCircle, Star, Loader2 } from "lucide-react"
import { MobileLayout } from "@/components/mobile-layout"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/lib/auth-context"
import { api, ChatRoom } from "@/lib/api"
import { cn } from "@/lib/utils"

interface Notification {
  id: string
  type: "follow" | "sympathy" | "chat" | "score"
  message: string
  fromUser?: {
    id: number
    name: string
    avatar: string
  }
  link?: string
  createdAt: string
  isRead: boolean
}

export default function NotificationsPage() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        // 채팅방에서 읽지 않은 메시지 가져오기
        const chatResult = await api.getChatRooms()
        if (chatResult.success) {
          setChatRooms(chatResult.data.content.filter((room: ChatRoom) => room.unreadCount > 0))

          // 채팅 알림 생성
          const chatNotifications: Notification[] = chatResult.data.content
            .filter((room: ChatRoom) => room.unreadCount > 0)
            .map((room: ChatRoom) => ({
              id: `chat-${room.id}`,
              type: "chat" as const,
              message: `${room.otherUser.name}님이 메시지를 보냈습니다`,
              fromUser: {
                id: room.otherUser.id,
                name: room.otherUser.name,
                avatar: room.otherUser.avatar
              },
              link: `/chat?room=${room.uuid}`,
              createdAt: room.lastMessageAt,
              isRead: false
            }))

          setNotifications(chatNotifications)
        }
      } catch (err) {
        console.error("알림 로드 실패:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchNotifications()
  }, [user])

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "방금 전"
    if (minutes < 60) return `${minutes}분 전`
    if (hours < 24) return `${hours}시간 전`
    if (days < 7) return `${days}일 전`
    return date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" })
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "follow":
        return <UserPlus className="h-4 w-4 text-blue-500" />
      case "sympathy":
        return <Heart className="h-4 w-4 text-red-500" />
      case "chat":
        return <MessageCircle className="h-4 w-4 text-green-500" />
      case "score":
        return <Star className="h-4 w-4 text-yellow-500" />
      default:
        return <Bell className="h-4 w-4 text-gray-500" />
    }
  }

  if (!user) {
    return (
      <MobileLayout>
        <header className="sticky top-0 z-50 bg-card border-b border-border">
          <div className="flex items-center px-4 py-3">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="font-bold text-lg text-foreground ml-2">알림</h1>
          </div>
        </header>
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
          <Bell className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">로그인 후 알림을 확인할 수 있어요</p>
          <Link href="/login">
            <Button>로그인</Button>
          </Link>
        </div>
      </MobileLayout>
    )
  }

  return (
    <MobileLayout>
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="flex items-center px-4 py-3">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="font-bold text-lg text-foreground ml-2">알림</h1>
        </div>
      </header>

      <div className="p-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : notifications.length > 0 ? (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <Link
                key={notification.id}
                href={notification.link || "#"}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-xl transition-colors",
                  notification.isRead ? "bg-background" : "bg-primary/5"
                )}
              >
                {notification.fromUser ? (
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={notification.fromUser.avatar || "/placeholder.svg"} />
                    <AvatarFallback>{notification.fromUser.name[0]}</AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                    {getIcon(notification.type)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{notification.message}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatTime(notification.createdAt)}
                  </p>
                </div>
                <div className="shrink-0">
                  {getIcon(notification.type)}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
              <Bell className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground mb-1">알림이 없어요</p>
            <p className="text-sm text-muted-foreground">새로운 소식이 오면 알려드릴게요</p>
          </div>
        )}
      </div>
    </MobileLayout>
  )
}
