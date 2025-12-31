"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, UserX, Loader2 } from "lucide-react"
import { MobileLayout } from "@/components/mobile-layout"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { api, BlockedUser } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"

export default function BlockedUsersPage() {
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<BlockedUser | null>(null)
  const [isUnblocking, setIsUnblocking] = useState(false)

  useEffect(() => {
    if (!currentUser) {
      router.push("/login")
      return
    }

    const fetchBlockedUsers = async () => {
      try {
        const result = await api.getBlockedUsers()
        if (result.success) {
          setBlockedUsers(result.data.content)
        }
      } catch (error) {
        console.error("Failed to fetch blocked users:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchBlockedUsers()
  }, [currentUser, router])

  const handleUnblock = async () => {
    if (!selectedUser) return

    setIsUnblocking(true)
    try {
      await api.unblockUser(selectedUser.id)
      setBlockedUsers((prev) => prev.filter((u) => u.id !== selectedUser.id))
      setSelectedUser(null)
    } catch (error) {
      console.error("Failed to unblock user:", error)
      alert("차단 해제에 실패했습니다")
    } finally {
      setIsUnblocking(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "Asia/Seoul",
    })
  }

  if (isLoading) {
    return (
      <MobileLayout hideNavigation>
        <header className="sticky top-0 z-50 bg-card border-b border-border">
          <div className="flex items-center gap-3 px-4 py-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold text-foreground">차단 관리</h1>
          </div>
        </header>
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MobileLayout>
    )
  }

  return (
    <MobileLayout hideNavigation>
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">차단 관리</h1>
        </div>
      </header>

      <div className="p-4">
        {blockedUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <UserX className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              차단한 사용자가 없습니다
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground mb-4">
              차단한 사용자 {blockedUsers.length}명
            </p>
            {blockedUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 p-4 bg-card rounded-lg border"
              >
                <Link href={`/profile/${user.id}`}>
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                    <AvatarFallback>{user.name[0]}</AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link href={`/profile/${user.id}`}>
                      <span className="font-medium text-foreground hover:underline">
                        {user.name}
                      </span>
                    </Link>
                    <Badge variant="secondary" className="text-xs">
                      {user.tasteGrade}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDate(user.blockedAt)} 차단됨
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedUser(user)}
                >
                  차단 해제
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 차단 해제 확인 다이얼로그 */}
      <AlertDialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>차단 해제</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <strong>{selectedUser?.name}</strong>님의 차단을 해제하시겠습니까?
                <br /><br />
                차단 해제 후:
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>이 사용자의 리뷰가 피드에 다시 표시됩니다</li>
                  <li>이 사용자와 다시 채팅할 수 있습니다</li>
                  <li>팔로우는 자동으로 복구되지 않습니다</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUnblocking}>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnblock} disabled={isUnblocking}>
              {isUnblocking ? "해제 중..." : "차단 해제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MobileLayout>
  )
}
