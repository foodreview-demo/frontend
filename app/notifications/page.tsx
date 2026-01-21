"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Bell, Heart, UserPlus, MessageCircle, Star, Loader2, CheckCheck } from "lucide-react"
import { MobileLayout } from "@/components/mobile-layout"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "@/lib/i18n-context"
import { api, Notification as NotificationType } from "@/lib/api"
import { cn } from "@/lib/utils"

export default function NotificationsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const t = useTranslation()
  const [notifications, setNotifications] = useState<NotificationType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)

  const fetchNotifications = async (pageNum: number, append = false) => {
    if (!user) {
      setIsLoading(false)
      return
    }

    try {
      const result = await api.getNotifications(pageNum)
      if (result.success) {
        if (append) {
          setNotifications(prev => [...prev, ...result.data.content])
        } else {
          setNotifications(result.data.content)
        }
        setHasMore(!result.data.last)
      }
    } catch (err) {
      console.error("알림 로드 실패:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications(0)
  }, [user])

  const handleMarkAllAsRead = async () => {
    try {
      const result = await api.markAllNotificationsAsRead()
      if (result.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      }
    } catch (err) {
      console.error("모두 읽음 처리 실패:", err)
    }
  }

  const handleNotificationClick = async (notification: NotificationType) => {
    // 읽음 처리
    if (!notification.isRead) {
      try {
        await api.markNotificationAsRead(notification.id)
        setNotifications(prev =>
          prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
        )
      } catch (err) {
        console.error("읽음 처리 실패:", err)
      }
    }

    // 알림 타입에 따라 이동
    if (notification.referenceId) {
      // COMMENT, SYMPATHY, REPLY 등은 리뷰 상세로 이동
      if (notification.type === 'COMMENT' || notification.type === 'SYMPATHY' || notification.type === 'REPLY' || notification.type === 'REFERENCE') {
        router.push(`/reviews/${notification.referenceId}`)
      } else if (notification.type === 'FOLLOW') {
        router.push(`/profile/${notification.referenceId}`)
      } else {
        router.push(`/reviews/${notification.referenceId}`)
      }
    }
  }

  const loadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchNotifications(nextPage, true)
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return t.time.justNow
    if (minutes < 60) return `${minutes}${t.time.minutesAgo}`
    if (hours < 24) return `${hours}${t.time.hoursAgo}`
    if (days < 7) return `${days}${t.time.daysAgo}`
    return date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" })
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "FOLLOW":
        return <UserPlus className="h-4 w-4 text-blue-500" />
      case "SYMPATHY":
        return <Heart className="h-4 w-4 text-red-500" />
      case "COMMENT":
      case "REPLY":
        return <MessageCircle className="h-4 w-4 text-green-500" />
      default:
        return <Bell className="h-4 w-4 text-gray-500" />
    }
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

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
            <h1 className="font-bold text-lg text-foreground ml-2">{t.notification.title}</h1>
          </div>
        </header>
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
          <Bell className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">{t.notification.loginRequired}</p>
          <Link href="/login">
            <Button>{t.auth.login}</Button>
          </Link>
        </div>
      </MobileLayout>
    )
  }

  return (
    <MobileLayout>
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="font-bold text-lg text-foreground ml-2">{t.notification.title}</h1>
            {unreadCount > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-xs"
            >
              <CheckCheck className="h-4 w-4 mr-1" />
              {t.notification.markAllRead}
            </Button>
          )}
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
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-xl transition-colors cursor-pointer",
                  notification.isRead ? "bg-background" : "bg-primary/5"
                )}
              >
                {notification.actor ? (
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={notification.actor.avatar || "/placeholder.svg"} />
                    <AvatarFallback>{notification.actor.name[0]}</AvatarFallback>
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
              </div>
            ))}
            {hasMore && (
              <div className="flex justify-center pt-4">
                <Button variant="outline" onClick={loadMore}>
                  {t.review.viewMore}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
              <Bell className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground mb-1">{t.notification.noNotifications}</p>
            <p className="text-sm text-muted-foreground">{t.notification.willNotify}</p>
          </div>
        )}
      </div>
    </MobileLayout>
  )
}
