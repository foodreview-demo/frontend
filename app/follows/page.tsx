"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Sparkles, MessageCircle, UserPlus, MapPin, Check, Users, Loader2,
  Trophy, Search, UserCheck, UsersRound, Plus, X
} from "lucide-react"
import { MobileLayout } from "@/components/mobile-layout"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { api, RecommendedUser, User, ChatRoom } from "@/lib/api"
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

// 시간을 자연스럽게 표시 (오늘/어제/날짜)
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

export default function FollowsPage() {
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const [activeTab, setActiveTab] = useState("following")
  const [recommendations, setRecommendations] = useState<RecommendedUser[]>([])
  const [followingList, setFollowingList] = useState<User[]>([])
  const [followerList, setFollowerList] = useState<User[]>([])
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
  const [followingIds, setFollowingIds] = useState<Set<number>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // 단체톡 생성 관련 상태
  const [isGroupChatModalOpen, setIsGroupChatModalOpen] = useState(false)
  const [selectedMembers, setSelectedMembers] = useState<User[]>([])
  const [groupChatName, setGroupChatName] = useState("")
  const [isCreatingGroupChat, setIsCreatingGroupChat] = useState(false)

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
        onClick: () => router.push(`/chat?room=${notification.roomUuid}`),
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

  const refreshChatRooms = useCallback(async () => {
    try {
      const chatResult = await api.getChatRooms()
      if (chatResult.success) {
        setChatRooms(chatResult.data.content)
      }
    } catch (err) {
      console.error("채팅방 목록 갱신 실패:", err)
    }
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) {
        setIsLoading(false)
        return
      }
      setIsLoading(true)
      setError(null)
      try {
        const [recResult, chatResult, followingResult, followerResult] = await Promise.all([
          api.getRecommendedFriends(),
          api.getChatRooms(),
          api.getFollowings(currentUser.id),
          api.getFollowers(currentUser.id),
        ])

        if (recResult.success) setRecommendations(recResult.data)
        if (chatResult.success) setChatRooms(chatResult.data.content)
        if (followingResult.success) {
          setFollowingList(followingResult.data.content)
          setFollowingIds(new Set(followingResult.data.content.map((u: User) => u.id)))
        }
        if (followerResult.success) setFollowerList(followerResult.data.content)
        
      } catch (err) {
        console.error("데이터 로드 실패:", err)
        setError("데이터를 불러오는데 실패했습니다")
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [currentUser])

  useEffect(() => {
    const handleFocus = () => refreshChatRooms()
    window.addEventListener("focus", handleFocus)
    return () => window.removeEventListener("focus", handleFocus)
  }, [refreshChatRooms])

  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }
    setIsSearching(true)
    try {
      const result = await api.searchRestaurants(query, undefined, undefined, 0, 10) // This should be a user search API
      // Placeholder: currently no user search API, using a mock from recommendations
      const mockResults = recommendations.filter(u => u.name.toLowerCase().includes(query.toLowerCase()));
      setSearchResults(mockResults);

    } catch (err) {
      console.error("검색 실패:", err)
    } finally {
      setIsSearching(false)
    }
  }, [recommendations])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) searchUsers(searchQuery)
      else setSearchResults([])
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, searchUsers])

  const handleFollow = async (userId: number) => {
    try {
      if (followingIds.has(userId)) {
        await api.unfollow(userId)
        setFollowingIds((prev) => {
          const next = new Set(prev)
          next.delete(userId)
          return next
        })
        setFollowingList((prev) => prev.filter((u) => u.id !== userId))
      } else {
        await api.follow(userId)
        setFollowingIds((prev) => new Set(prev).add(userId))
        const user = recommendations.find((r) => r.id === userId) || searchResults.find((r) => r.id === userId)
        if (user) setFollowingList((prev) => [...prev, user])
      }
    } catch (err) {
      console.error("팔로우 처리 실패:", err)
      alert("팔로우 처리에 실패했습니다")
    }
  }

  const handleStartChat = async (userId: number) => {
    try {
      const result = await api.getOrCreateChatRoom(userId)
      if (result.success && result.data.uuid) {
        router.push(`/chat?room=${result.data.uuid}`)
      } else {
        console.error("UUID가 없음:", result)
        alert("채팅방을 열 수 없습니다")
      }
    } catch (err) {
      console.error("채팅방 생성 실패:", err)
      alert("채팅방을 열 수 없습니다")
    }
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

  // 모달 닫기
  const closeGroupChatModal = () => {
    setIsGroupChatModalOpen(false)
    setSelectedMembers([])
    setGroupChatName("")
  }

  const renderUserList = (users: User[], emptyMessage: string, emptySubMessage: string, showChatButton: boolean) => {
    if (users.length === 0) {
      return (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary/50 flex items-center justify-center">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="font-medium text-foreground mb-1">{emptyMessage}</p>
          <p className="text-sm text-muted-foreground">{emptySubMessage}</p>
        </div>
      )
    }
    return users.map((user) => {
      const level = getTasteLevel(user.tasteScore)
      return (
        <div key={user.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors">
          <Link href={`/profile/${user.id}`}>
            <Avatar className="h-12 w-12 ring-2 ring-background shadow-sm">
              <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
              <AvatarFallback className="bg-primary/10 text-primary font-medium">{user.name[0]}</AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Link href={`/profile/${user.id}`} className="font-semibold text-foreground hover:text-primary transition-colors">
                {user.name}
              </Link>
              <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0", level.color)}>
                {level.label}
              </Badge>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
              <MapPin className="h-3 w-3" />
              <span>{user.region}</span>
              <span className="text-border">•</span>
              <span className="text-primary font-medium">{user.tasteScore.toLocaleString()}점</span>
            </div>
          </div>
          {showChatButton && (
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full hover:bg-primary/10 hover:text-primary"
              onClick={() => handleStartChat(user.id)}
            >
              <MessageCircle className="h-5 w-5" />
            </Button>
          )}
        </div>
      )
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

  return (
    <MobileLayout>
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold text-foreground">소셜</h1>
          <Link href="/ranking">
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
              <Trophy className="h-4 w-4" />
              랭킹
            </Button>
          </Link>
        </div>
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="사용자 검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary/50 border-0 rounded-full h-9"
            />
          </div>
        </div>
      </header>

      {searchQuery && (
        <div className="px-4 py-2 bg-background border-b border-border">
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {isSearching ? (
              <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
            ) : searchResults.length > 0 ? (
              searchResults.map((user) => {
                const level = getTasteLevel(user.tasteScore)
                const isFollowing = followingIds.has(user.id)
                const isMe = currentUser?.id === user.id

                return (
                  <div key={user.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-secondary/50 transition-colors">
                    <Link href={`/profile/${user.id}`}>
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                        <AvatarFallback className="bg-primary/10 text-primary">{user.name[0]}</AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground truncate">{user.name}</span>
                        <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0", level.color)}>{level.label}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{user.region}</p>
                    </div>
                    {!isMe && (
                      <Button
                        size="sm"
                        variant={isFollowing ? "outline" : "default"}
                        className="h-8 px-3"
                        onClick={() => handleFollow(user.id)}
                      >
                        {isFollowing ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                      </Button>
                    )}
                  </div>
                )
              })
            ) : (
              <p className="text-center text-sm text-muted-foreground py-4">검색 결과가 없습니다</p>
            )}
          </div>
        </div>
      )}

      <div className="p-4 space-y-4">
        {error ? (
          <div className="text-center py-12"><p className="text-muted-foreground">{error}</p></div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 bg-secondary/50 p-1 rounded-xl">
              <TabsTrigger value="following" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">팔로잉</TabsTrigger>
              <TabsTrigger value="follower" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">팔로워</TabsTrigger>
              <TabsTrigger value="recommend" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">추천</TabsTrigger>
              <TabsTrigger value="chat" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">채팅</TabsTrigger>
            </TabsList>

            <TabsContent value="following" className="mt-4 space-y-2">
              {renderUserList(followingList, "아직 팔로우하는 사람이 없어요", "비슷한 취향의 맛잘알을 팔로우해보세요", true)}
            </TabsContent>
            
            <TabsContent value="follower" className="mt-4 space-y-2">
              {renderUserList(followerList, "아직 팔로워가 없어요", "리뷰를 작성하고 맛잘알 점수를 높여보세요", false)}
            </TabsContent>

            <TabsContent value="recommend" className="mt-4 space-y-3">
              <Card className="p-4 bg-primary/5 border-primary/20">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center"><Sparkles className="h-5 w-5 text-primary" /></div>
                  <div>
                    <h3 className="font-semibold text-foreground">AI 사용자 추천</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      <span className="text-primary font-medium">맛잘알 점수, 지역, 선호 카테고리</span>를 분석해서 비슷한 취향의 사용자를 추천해드려요!
                    </p>
                  </div>
                </div>
              </Card>

              {recommendations.length > 0 ? (
                recommendations.map((user) => {
                  const level = getTasteLevel(user.tasteScore)
                  const isFollowing = followingIds.has(user.id)
                  return (
                    <Card key={user.id} className="p-4 border border-border">
                      <div className="flex items-start gap-3">
                        <Link href={`/profile/${user.id}`}>
                          <Avatar className="h-14 w-14 ring-2 ring-primary/20">
                            <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                            <AvatarFallback>{user.name[0]}</AvatarFallback>
                          </Avatar>
                        </Link>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Link href={`/profile/${user.id}`} className="font-semibold text-foreground hover:underline">{user.name}</Link>
                            <Badge variant="secondary" className={cn("text-xs", level.color)}>{level.label}</Badge>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                            <MapPin className="h-3 w-3" />
                            <span>{user.region}</span>
                            <span>·</span>
                            <span>{user.tasteScore.toLocaleString()}점</span>
                          </div>
                          <div className="flex items-center gap-1 mb-3">
                            <Sparkles className="h-3 w-3 text-primary" />
                            <span className="text-sm text-primary font-medium">{user.recommendReason}</span>
                          </div>
                          {user.commonCategories && user.commonCategories.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {user.commonCategories.map((cat) => (<Badge key={cat} variant="outline" className="text-xs">{cat}</Badge>))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button className={cn("flex-1", isFollowing ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground")} onClick={() => handleFollow(user.id)}>
                          {isFollowing ? <><UserCheck className="h-4 w-4 mr-2" />팔로잉</> : <><UserPlus className="h-4 w-4 mr-2" />팔로우</>}
                        </Button>
                        <Button variant="outline" onClick={() => handleStartChat(user.id)}><MessageCircle className="h-4 w-4" /></Button>
                      </div>
                    </Card>
                  )
                })
              ) : (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">추천할 사용자가 없습니다</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="chat" className="mt-4 space-y-2">
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

              {chatRooms.length > 0 ? (
                chatRooms.map((room) => {
                  const isGroupChat = room.roomType === 'GROUP'
                  const displayName = isGroupChat
                    ? (room.name || room.members?.filter(m => m.user.id !== currentUser?.id).slice(0, 3).map(m => m.user.name).join(', ') || '단체 채팅방')
                    : room.otherUser?.name || '알 수 없는 사용자'
                  const displayAvatar = isGroupChat ? null : room.otherUser?.avatar

                  return (
                    <Link key={room.id} href={`/chat?room=${room.uuid}`}>
                      <div className={cn("flex items-center gap-3 p-3 rounded-xl transition-colors", room.unreadCount > 0 ? "bg-primary/5" : "hover:bg-secondary/50")}>
                        <div className="relative">
                          {isGroupChat ? (
                            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-background shadow-sm">
                              <UsersRound className="h-7 w-7 text-primary" />
                            </div>
                          ) : (
                            <Avatar className="h-14 w-14 ring-2 ring-background shadow-sm">
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
                            <span className={cn("text-xs whitespace-nowrap", room.unreadCount > 0 ? "text-primary font-medium" : "text-muted-foreground")}>
                              {room.lastMessageAt ? formatChatTime(room.lastMessageAt) : ""}
                            </span>
                          </div>
                          <p className={cn("text-sm truncate", room.unreadCount > 0 ? "text-foreground" : "text-muted-foreground")}>
                            {room.lastMessage || "대화를 시작해보세요"}
                          </p>
                        </div>
                      </div>
                    </Link>
                  )
                })
              ) : (
                <div className="text-center py-16">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary/50 flex items-center justify-center">
                    <MessageCircle className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="font-medium text-foreground mb-1">아직 대화가 없어요</p>
                  <p className="text-sm text-muted-foreground mb-4">새로운 사용자와 대화를 시작해보세요</p>
                  <Button onClick={() => setActiveTab("recommend")} size="sm" variant="outline">
                    사용자 추천 보기
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* 단체톡 생성 모달 */}
      <Dialog open={isGroupChatModalOpen} onOpenChange={setIsGroupChatModalOpen}>
        <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>단체톡 만들기</DialogTitle>
          </DialogHeader>

          {/* 채팅방 이름 입력 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">채팅방 이름 (선택)</label>
            <Input
              placeholder="채팅방 이름을 입력하세요"
              value={groupChatName}
              onChange={(e) => setGroupChatName(e.target.value)}
              maxLength={50}
            />
          </div>

          {/* 선택된 멤버 표시 */}
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

          {/* 팔로잉 목록에서 선택 */}
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

          {/* 생성 버튼 */}
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
    </MobileLayout>
  )
}
