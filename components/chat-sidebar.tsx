"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  MessageCircle, Loader2, UsersRound, Plus, X, Check, Users
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { api, User, ChatRoom } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { useNotificationSocket, NewMessageNotification } from "@/lib/use-notification-socket"
import { requestNotificationPermission, showBrowserNotification } from "@/lib/browser-notification"
import { cn } from "@/lib/utils"

function getTasteLevel(score: number): { label: string; color: string } {
  if (score >= 2000) return { label: "마스터", color: "bg-primary text-primary-foreground" }
  if (score >= 1500) return { label: "전문가", color: "bg-accent text-accent-foreground" }
  if (score >= 1000) return { label: "미식가", color: "bg-secondary text-secondary-foreground" }
  if (score >= 500) return { label: "탐험가", color: "bg-muted text-muted-foreground" }
  return { label: "입문자", color: "bg-muted text-muted-foreground" }
}

function formatChatTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const oneDay = 24 * 60 * 60 * 1000

  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: true })
  }
  if (new Date(now.getTime() - oneDay).toDateString() === date.toDateString()) {
    return "어제"
  }
  if (diff < 7 * oneDay) {
    return date.toLocaleDateString("ko-KR", { weekday: "short" })
  }
  return date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" })
}

interface ChatSidebarProps {
  children?: React.ReactNode
}

export function ChatSidebar({ children }: ChatSidebarProps) {
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [followingList, setFollowingList] = useState<User[]>([])

  // 단체톡 생성 관련 상태
  const [isGroupChatModalOpen, setIsGroupChatModalOpen] = useState(false)
  const [selectedMembers, setSelectedMembers] = useState<User[]>([])
  const [groupChatName, setGroupChatName] = useState("")
  const [isCreatingGroupChat, setIsCreatingGroupChat] = useState(false)

  // 총 읽지 않은 메시지 수
  const totalUnreadCount = chatRooms.reduce((sum, room) => sum + room.unreadCount, 0)

  const handleNewMessageNotification = useCallback((notification: NewMessageNotification) => {
    setChatRooms((prev) => {
      const updatedRooms = prev.map((room) =>
        room.uuid === notification.roomUuid
          ? { ...room, lastMessage: notification.message.content, lastMessageAt: notification.message.createdAt, unreadCount: room.unreadCount + 1 }
          : room
      )
      return updatedRooms.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())
    })
    showBrowserNotification(
      `${notification.message.senderName}님의 메시지`,
      {
        body: notification.message.content,
        icon: notification.message.senderAvatar || "/placeholder.svg",
        tag: `chat-${notification.roomUuid}`,
        onClick: () => {
          setIsOpen(false)
          router.push(`/chat?room=${notification.roomUuid}`)
        },
      }
    )
  }, [router])

  useNotificationSocket({
    userId: currentUser?.id || 0,
    onNotification: handleNewMessageNotification,
    enabled: !!currentUser,
  })

  useEffect(() => {
    if (currentUser) {
      requestNotificationPermission()
    }
  }, [currentUser])

  const fetchData = useCallback(async () => {
    if (!currentUser) return

    setIsLoading(true)
    try {
      const [chatResult, followingResult] = await Promise.all([
        api.getChatRooms(),
        api.getFollowings(currentUser.id),
      ])

      if (chatResult.success) {
        setChatRooms(chatResult.data.content)
      }
      if (followingResult.success) {
        setFollowingList(followingResult.data.content)
      }
    } catch (err) {
      console.error("채팅방 데이터 로드 실패:", err)
    } finally {
      setIsLoading(false)
    }
  }, [currentUser])

  // 사이드바가 열릴 때 데이터 로드
  useEffect(() => {
    if (isOpen && currentUser) {
      fetchData()
    }
  }, [isOpen, currentUser, fetchData])

  // 포커스 시 새로고침
  useEffect(() => {
    const handleFocus = () => {
      if (isOpen) fetchData()
    }
    window.addEventListener("focus", handleFocus)
    return () => window.removeEventListener("focus", handleFocus)
  }, [isOpen, fetchData])

  const handleChatRoomClick = (roomUuid: string) => {
    setIsOpen(false)
    router.push(`/chat?room=${roomUuid}`)
  }

  // 단체톡 멤버 선택/해제
  const toggleMemberSelection = (user: User) => {
    setSelectedMembers((prev) => {
      const isSelected = prev.some((m) => m.id === user.id)
      if (isSelected) {
        return prev.filter((m) => m.id !== user.id)
      } else {
        return [...prev, user]
      }
    })
  }

  // 단체톡 생성
  const handleCreateGroupChat = async () => {
    if (selectedMembers.length < 2) {
      alert("단체톡은 최소 2명 이상 선택해야 합니다")
      return
    }

    setIsCreatingGroupChat(true)
    try {
      const memberIds = selectedMembers.map((m) => m.id)
      const result = await api.createGroupChatRoom(groupChatName || null, memberIds)
      if (result.success && result.data.uuid) {
        setIsGroupChatModalOpen(false)
        setSelectedMembers([])
        setGroupChatName("")
        setIsOpen(false)
        router.push(`/chat?room=${result.data.uuid}`)
      } else {
        alert("단체톡방 생성에 실패했습니다")
      }
    } catch (err) {
      console.error("단체톡방 생성 실패:", err)
      alert("단체톡방 생성에 실패했습니다")
    } finally {
      setIsCreatingGroupChat(false)
    }
  }

  const closeGroupChatModal = () => {
    setIsGroupChatModalOpen(false)
    setSelectedMembers([])
    setGroupChatName("")
  }

  if (!currentUser) {
    return <>{children}</>
  }

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          {children || (
            <Button variant="ghost" size="icon" className="relative">
              <MessageCircle className="h-5 w-5" />
              {totalUnreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-semibold">
                  {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
                </span>
              )}
            </Button>
          )}
        </SheetTrigger>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
          <SheetHeader className="p-4 border-b">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                채팅
              </SheetTitle>
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-2">
              {/* 단체톡 생성 버튼 */}
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-14 rounded-xl border-dashed"
                onClick={() => setIsGroupChatModalOpen(true)}
              >
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Plus className="h-5 w-5 text-primary" />
                </div>
                <span className="font-medium">단체톡 만들기</span>
              </Button>

              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : chatRooms.length > 0 ? (
                chatRooms.map((room) => {
                  const isGroupChat = room.roomType === 'GROUP'
                  const displayName = isGroupChat
                    ? (room.name || room.members?.filter(m => m.user.id !== currentUser?.id).slice(0, 3).map(m => m.user.name).join(', ') || '단체 채팅방')
                    : room.otherUser?.name || '알 수 없는 사용자'
                  const displayAvatar = isGroupChat ? null : room.otherUser?.avatar

                  return (
                    <button
                      key={room.id}
                      onClick={() => handleChatRoomClick(room.uuid)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left",
                        room.unreadCount > 0 ? "bg-primary/5" : "hover:bg-secondary/50"
                      )}
                    >
                      <div className="relative shrink-0">
                        {isGroupChat ? (
                          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-background shadow-sm">
                            <UsersRound className="h-6 w-6 text-primary" />
                          </div>
                        ) : (
                          <Avatar className="h-12 w-12 ring-2 ring-background shadow-sm">
                            <AvatarImage src={displayAvatar || "/placeholder.svg"} alt={displayName} />
                            <AvatarFallback className="bg-primary/10 text-primary font-medium">{displayName[0]}</AvatarFallback>
                          </Avatar>
                        )}
                        {room.unreadCount > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 h-5 min-w-5 px-1.5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-semibold shadow-sm">
                            {room.unreadCount > 99 ? "99+" : room.unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-semibold text-foreground truncate">{displayName}</span>
                            {isGroupChat && (
                              <Badge variant="secondary" className="text-[10px] shrink-0">
                                {room.memberCount}명
                              </Badge>
                            )}
                          </div>
                          <span className={cn("text-xs whitespace-nowrap shrink-0", room.unreadCount > 0 ? "text-primary font-medium" : "text-muted-foreground")}>
                            {room.lastMessageAt ? formatChatTime(room.lastMessageAt) : ""}
                          </span>
                        </div>
                        <p className={cn("text-sm truncate", room.unreadCount > 0 ? "text-foreground" : "text-muted-foreground")}>
                          {room.lastMessage || "대화를 시작해보세요"}
                        </p>
                      </div>
                    </button>
                  )
                })
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary/50 flex items-center justify-center">
                    <MessageCircle className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="font-medium text-foreground mb-1">아직 대화가 없어요</p>
                  <p className="text-sm text-muted-foreground mb-4">새로운 사용자와 대화를 시작해보세요</p>
                  <Link href="/follows">
                    <Button size="sm" variant="outline" onClick={() => setIsOpen(false)}>
                      친구 찾기
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* 단체톡 생성 모달 */}
      <Dialog open={isGroupChatModalOpen} onOpenChange={setIsGroupChatModalOpen}>
        <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>단체톡 만들기</DialogTitle>
          </DialogHeader>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">채팅방 이름 (선택)</label>
            <Input
              placeholder="채팅방 이름을 입력하세요"
              value={groupChatName}
              onChange={(e) => setGroupChatName(e.target.value)}
              maxLength={50}
            />
          </div>

          {selectedMembers.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                선택된 멤버 ({selectedMembers.length}명)
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedMembers.map((member) => (
                  <Badge
                    key={member.id}
                    variant="secondary"
                    className="pl-2 pr-1 py-1 flex items-center gap-1"
                  >
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={member.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="text-[10px]">{member.name[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs">{member.name}</span>
                    <button
                      onClick={() => toggleMemberSelection(member)}
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
              팔로잉 목록에서 선택 (최소 2명)
            </label>
            <div className="flex-1 overflow-y-auto space-y-1 pr-2">
              {followingList.length > 0 ? (
                followingList.map((user) => {
                  const isSelected = selectedMembers.some((m) => m.id === user.id)
                  const level = getTasteLevel(user.tasteScore)
                  return (
                    <div
                      key={user.id}
                      onClick={() => toggleMemberSelection(user)}
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
                  <p className="text-sm text-muted-foreground">팔로잉하는 사용자가 없습니다</p>
                  <p className="text-xs text-muted-foreground mt-1">먼저 사용자를 팔로우해주세요</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" className="flex-1" onClick={closeGroupChatModal}>
              취소
            </Button>
            <Button
              className="flex-1"
              onClick={handleCreateGroupChat}
              disabled={selectedMembers.length < 2 || isCreatingGroupChat}
            >
              {isCreatingGroupChat ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <UsersRound className="h-4 w-4 mr-2" />
              )}
              {selectedMembers.length < 2
                ? `${2 - selectedMembers.length}명 더 선택`
                : `${selectedMembers.length}명과 대화 시작`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// 채팅 버튼 컴포넌트 (다른 곳에서 사용할 수 있게 export)
export function ChatButton() {
  const { user: currentUser } = useAuth()
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])

  const handleNewMessageNotification = useCallback((notification: NewMessageNotification) => {
    setChatRooms((prev) => {
      const updatedRooms = prev.map((room) =>
        room.uuid === notification.roomUuid
          ? { ...room, unreadCount: room.unreadCount + 1 }
          : room
      )
      return updatedRooms
    })
  }, [])

  useNotificationSocket({
    userId: currentUser?.id || 0,
    onNotification: handleNewMessageNotification,
    enabled: !!currentUser,
  })

  useEffect(() => {
    if (!currentUser) return
    api.getChatRooms().then((result) => {
      if (result.success) {
        setChatRooms(result.data.content)
      }
    }).catch(console.error)
  }, [currentUser])

  const totalUnreadCount = chatRooms.reduce((sum, room) => sum + room.unreadCount, 0)

  return (
    <ChatSidebar>
      <button className="relative h-14 w-14 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl hover:bg-primary/90 transition-all flex items-center justify-center">
        <MessageCircle className="h-6 w-6" />
        {totalUnreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-6 min-w-6 px-1.5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-md">
            {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
          </span>
        )}
      </button>
    </ChatSidebar>
  )
}
