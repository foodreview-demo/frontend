"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Sparkles, MessageCircle, UserPlus, MapPin, Check, Users, Loader2,
  Trophy, Search, Crown, Medal, ChevronRight
} from "lucide-react"
import { MobileLayout } from "@/components/mobile-layout"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="h-8 w-8 rounded-full bg-yellow-400 flex items-center justify-center">
        <Crown className="h-4 w-4 text-yellow-900" />
      </div>
    )
  }
  if (rank === 2) {
    return (
      <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
        <Medal className="h-4 w-4 text-gray-700" />
      </div>
    )
  }
  if (rank === 3) {
    return (
      <div className="h-8 w-8 rounded-full bg-amber-600 flex items-center justify-center">
        <Medal className="h-4 w-4 text-amber-100" />
      </div>
    )
  }
  return (
    <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
      <span className="font-bold text-sm text-secondary-foreground">{rank}</span>
    </div>
  )
}

// 시간을 자연스럽게 표시 (오늘/어제/날짜)
function formatChatTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const oneDay = 24 * 60 * 60 * 1000

  // 오늘
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  }

  // 어제
  const yesterday = new Date(now.getTime() - oneDay)
  if (date.toDateString() === yesterday.toDateString()) {
    return "어제"
  }

  // 이번 주
  if (diff < 7 * oneDay) {
    return date.toLocaleDateString("ko-KR", { weekday: "short" })
  }

  // 그 이전
  return date.toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
  })
}

export default function FriendsPage() {
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const [activeTab, setActiveTab] = useState("friends")
  const [recommendations, setRecommendations] = useState<RecommendedUser[]>([])
  const [followings, setFollowings] = useState<User[]>([])
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
  const [followedIds, setFollowedIds] = useState<Set<number>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Friend search states
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // 새 메시지 알림 처리
  const handleNewMessageNotification = useCallback((notification: NewMessageNotification) => {
    // 채팅방 목록 업데이트
    setChatRooms((prev) => {
      const updatedRooms = prev.map((room) => {
        if (room.uuid === notification.roomUuid) {
          return {
            ...room,
            lastMessage: notification.message.content,
            lastMessageAt: notification.message.createdAt,
            unreadCount: room.unreadCount + 1,
          }
        }
        return room
      })
      // 최신 메시지 순으로 정렬
      return updatedRooms.sort((a, b) =>
        new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
      )
    })

    // 브라우저 알림 표시
    showBrowserNotification(
      `${notification.message.senderName}님의 메시지`,
      {
        body: notification.message.content,
        icon: notification.message.senderAvatar || "/placeholder.svg",
        tag: `chat-${notification.roomUuid}`,
        onClick: () => {
          router.push(`/chat?room=${notification.roomUuid}`)
        },
      }
    )
  }, [router])

  // 알림 WebSocket 구독
  useNotificationSocket({
    userId: currentUser?.id || 0,
    onNotification: handleNewMessageNotification,
    enabled: !!currentUser,
  })

  // 브라우저 알림 권한 요청
  useEffect(() => {
    if (currentUser) {
      requestNotificationPermission()
    }
  }, [currentUser])

  // 채팅방 목록만 갱신하는 함수
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

  // 초기 데이터 로드
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const [recResult, chatResult] = await Promise.all([
          api.getRecommendedFriends(),
          api.getChatRooms(),
        ])

        if (recResult.success) {
          setRecommendations(recResult.data)
        }
        if (chatResult.success) {
          setChatRooms(chatResult.data.content)
        }

        // Load followings if user is logged in
        if (currentUser) {
          const followResult = await api.getFollowings(currentUser.id)
          if (followResult.success) {
            setFollowings(followResult.data.content)
            setFollowedIds(new Set(followResult.data.content.map((u: User) => u.id)))
          }
        }
      } catch (err) {
        console.error("데이터 로드 실패:", err)
        setError("데이터를 불러오는데 실패했습니다")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [currentUser])

  // 페이지 포커스 시 채팅방 목록 갱신 (채팅방에서 돌아왔을 때 읽음 상태 반영)
  useEffect(() => {
    const handleFocus = () => {
      refreshChatRooms()
    }

    window.addEventListener("focus", handleFocus)
    return () => window.removeEventListener("focus", handleFocus)
  }, [refreshChatRooms])

  // Debounced search
  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }
    setIsSearching(true)
    try {
      // Search using ranking API with name filter (or a dedicated search API if available)
      const result = await api.getRanking(undefined, 0, 50)
      if (result.success) {
        const filtered = result.data.content.filter(
          (u) => u.name.toLowerCase().includes(query.toLowerCase()) ||
                 u.email?.toLowerCase().includes(query.toLowerCase())
        )
        setSearchResults(filtered)
      }
    } catch (err) {
      console.error("검색 실패:", err)
    } finally {
      setIsSearching(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchUsers(searchQuery)
      } else {
        setSearchResults([])
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, searchUsers])

  const handleFollow = async (userId: number) => {
    try {
      if (followedIds.has(userId)) {
        await api.unfollow(userId)
        setFollowedIds((prev) => {
          const next = new Set(prev)
          next.delete(userId)
          return next
        })
        setFollowings((prev) => prev.filter((u) => u.id !== userId))
      } else {
        await api.follow(userId)
        setFollowedIds((prev) => new Set(prev).add(userId))
        // Add to followings
        const user = recommendations.find((r) => r.id === userId) ||
                     searchResults.find((r) => r.id === userId)
        if (user) {
          setFollowings((prev) => [...prev, user])
        }
      }
    } catch (err) {
      console.error("친구 추가 처리 실패:", err)
      alert("친구 추가 처리에 실패했습니다")
    }
  }

  // Sort followings by taste score for friend ranking
  const friendRanking = [...followings].sort((a, b) => b.tasteScore - a.tasteScore)

  // Start chat with a user - create or get chat room and navigate
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
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold text-foreground">친구</h1>
          <Link href="/ranking">
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
              <Trophy className="h-4 w-4" />
              랭킹
            </Button>
          </Link>
        </div>

        {/* Search Bar - 헤더 안에 포함 */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="친구 검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary/50 border-0 rounded-full h-9"
            />
          </div>
        </div>
      </header>

      {/* Search Results Overlay */}
      {searchQuery && (
        <div className="px-4 py-2 bg-background border-b border-border">
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {isSearching ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            ) : searchResults.length > 0 ? (
              searchResults.map((user) => {
                const level = getTasteLevel(user.tasteScore)
                const isFollowed = followedIds.has(user.id)
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
                        <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0", level.color)}>
                          {level.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{user.region}</p>
                    </div>
                    {!isMe && (
                      <Button
                        size="sm"
                        variant={isFollowed ? "ghost" : "default"}
                        className={cn("h-8 px-3", isFollowed && "text-primary")}
                        onClick={() => handleFollow(user.id)}
                      >
                        {isFollowed ? <Check className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                      </Button>
                    )}
                  </div>
                )
              })
            ) : (
              <p className="text-center text-sm text-muted-foreground py-4">
                검색 결과가 없습니다
              </p>
            )}
          </div>
        </div>
      )}

      <div className="p-4 space-y-4">

        {error ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{error}</p>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 bg-secondary/50 p-1 rounded-xl">
              <TabsTrigger value="friends" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">친구</TabsTrigger>
              <TabsTrigger value="chat" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">채팅</TabsTrigger>
              <TabsTrigger value="recommend" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">추천</TabsTrigger>
              <TabsTrigger value="ranking" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">랭킹</TabsTrigger>
            </TabsList>

            {/* Friends Tab */}
            <TabsContent value="friends" className="mt-4 space-y-2">
              {followings.length > 0 ? (
                followings.map((user) => {
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
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-full hover:bg-primary/10 hover:text-primary"
                        onClick={() => handleStartChat(user.id)}
                      >
                        <MessageCircle className="h-5 w-5" />
                      </Button>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-16">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary/50 flex items-center justify-center">
                    <Users className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="font-medium text-foreground mb-1">아직 친구가 없어요</p>
                  <p className="text-sm text-muted-foreground mb-4">비슷한 취향의 맛잘알을 찾아보세요</p>
                  <Button onClick={() => setActiveTab("recommend")} size="sm">
                    <Sparkles className="h-4 w-4 mr-1.5" />
                    추천 친구 보기
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* Friend Ranking Tab */}
            <TabsContent value="ranking" className="mt-4 space-y-3">
              {friendRanking.length > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-foreground">친구 사이 랭킹</h3>
                    <span className="text-sm text-muted-foreground">총 {friendRanking.length}명</span>
                  </div>

                  {/* My Position */}
                  {currentUser && (
                    <Card className="p-3 bg-primary/5 border-primary/20">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                          <span className="font-bold text-sm text-primary-foreground">나</span>
                        </div>
                        <Avatar className="h-10 w-10 ring-2 ring-primary/30">
                          <AvatarImage src={currentUser.avatar || "/placeholder.svg"} alt={currentUser.name} />
                          <AvatarFallback>{currentUser.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <span className="font-semibold text-foreground">{currentUser.name}</span>
                          <p className="text-xs text-muted-foreground">{currentUser.tasteScore.toLocaleString()}점</p>
                        </div>
                      </div>
                    </Card>
                  )}

                  {friendRanking.map((user, index) => {
                    const level = getTasteLevel(user.tasteScore)
                    const rank = index + 1

                    return (
                      <Card key={user.id} className="p-3 flex items-center gap-3 border border-border hover:bg-secondary/50 transition-colors">
                        <RankBadge rank={rank} />
                        <Link href={`/profile/${user.id}`}>
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                            <AvatarFallback>{user.name[0]}</AvatarFallback>
                          </Avatar>
                        </Link>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Link href={`/profile/${user.id}`} className="font-semibold text-foreground hover:underline truncate">
                              {user.name}
                            </Link>
                            <Badge variant="secondary" className={cn("text-xs", level.color)}>
                              {level.label}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{user.region}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-foreground">{user.tasteScore.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">리뷰 {user.reviewCount}개</p>
                        </div>
                      </Card>
                    )
                  })}
                </>
              ) : (
                <div className="text-center py-12">
                  <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-2">친구를 추가하면 랭킹을 볼 수 있어요</p>
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab("recommend")}
                    className="mt-2"
                  >
                    친구 추천 보기
                  </Button>
                </div>
              )}

              {/* Link to Regional Ranking */}
              <Link href="/ranking">
                <Card className="p-4 mt-4 flex items-center justify-between hover:bg-secondary/50 transition-colors border border-border">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Trophy className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">지역별 전체 랭킹</p>
                      <p className="text-sm text-muted-foreground">모든 맛잘알의 순위를 확인하세요</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </Card>
              </Link>
            </TabsContent>

            {/* Recommendations Tab */}
            <TabsContent value="recommend" className="mt-4 space-y-3">
              {/* AI Recommendation Banner */}
              <Card className="p-4 bg-primary/5 border-primary/20">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">AI 친구 추천</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      <span className="text-primary font-medium">맛잘알 점수, 지역, 선호 카테고리</span>를 분석해서
                      비슷한 취향의 맛잘알을 추천해드려요!
                    </p>
                  </div>
                </div>
              </Card>

              {recommendations.length > 0 ? (
                recommendations.map((user) => {
                  const level = getTasteLevel(user.tasteScore)
                  const isFollowed = followedIds.has(user.id)

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
                            <Link href={`/profile/${user.id}`} className="font-semibold text-foreground hover:underline">
                              {user.name}
                            </Link>
                            <Badge variant="secondary" className={cn("text-xs", level.color)}>
                              {level.label}
                            </Badge>
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
                              {user.commonCategories.map((cat) => (
                                <Badge key={cat} variant="outline" className="text-xs">
                                  {cat}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button
                          className={cn(
                            "flex-1",
                            isFollowed ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground",
                          )}
                          onClick={() => handleFollow(user.id)}
                        >
                          {isFollowed ? (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              친구 추가됨
                            </>
                          ) : (
                            <>
                              <UserPlus className="h-4 w-4 mr-2" />
                              친구 추가
                            </>
                          )}
                        </Button>
                        <Button variant="outline" onClick={() => handleStartChat(user.id)}>
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  )
                })
              ) : (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">추천할 맛잘알이 없습니다</p>
                </div>
              )}
            </TabsContent>

            {/* Chat Tab */}
            <TabsContent value="chat" className="mt-4 space-y-2">
              {chatRooms.length > 0 ? (
                chatRooms.map((room) => (
                  <Link key={room.id} href={`/chat?room=${room.uuid}`}>
                    <div className={cn(
                      "flex items-center gap-3 p-3 rounded-xl transition-colors",
                      room.unreadCount > 0 ? "bg-primary/5" : "hover:bg-secondary/50"
                    )}>
                      <div className="relative">
                        <Avatar className="h-14 w-14 ring-2 ring-background shadow-sm">
                          <AvatarImage src={room.otherUser.avatar || "/placeholder.svg"} alt={room.otherUser.name} />
                          <AvatarFallback className="bg-primary/10 text-primary font-medium">{room.otherUser.name[0]}</AvatarFallback>
                        </Avatar>
                        {room.unreadCount > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 h-5 min-w-5 px-1.5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-semibold shadow-sm">
                            {room.unreadCount > 99 ? "99+" : room.unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <span className="font-semibold text-foreground truncate">{room.otherUser.name}</span>
                          <span className={cn(
                            "text-xs whitespace-nowrap",
                            room.unreadCount > 0 ? "text-primary font-medium" : "text-muted-foreground"
                          )}>
                            {room.lastMessageAt ? formatChatTime(room.lastMessageAt) : ""}
                          </span>
                        </div>
                        <p className={cn(
                          "text-sm truncate",
                          room.unreadCount > 0 ? "text-foreground" : "text-muted-foreground"
                        )}>{room.lastMessage || "대화를 시작해보세요"}</p>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-16">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary/50 flex items-center justify-center">
                    <MessageCircle className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="font-medium text-foreground mb-1">아직 대화가 없어요</p>
                  <p className="text-sm text-muted-foreground mb-4">친구와 대화를 시작해보세요</p>
                  <Button onClick={() => setActiveTab("friends")} size="sm" variant="outline">
                    친구 목록 보기
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </MobileLayout>
  )
}
