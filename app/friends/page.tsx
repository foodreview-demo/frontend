"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
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

export default function FriendsPage() {
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
      console.error("팔로우 처리 실패:", err)
      alert("팔로우 처리에 실패했습니다")
    }
  }

  // Sort followings by taste score for friend ranking
  const friendRanking = [...followings].sort((a, b) => b.tasteScore - a.tasteScore)

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
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">친구</h1>
          </div>
          <Link href="/ranking">
            <Button variant="outline" size="sm" className="gap-1">
              <Trophy className="h-4 w-4" />
              지역 랭킹
            </Button>
          </Link>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Friend Search */}
        <Card className="p-4 border border-border">
          <div className="flex items-center gap-2 mb-3">
            <UserPlus className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">친구 추가</span>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="이름 또는 이메일로 검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Search Results */}
          {searchQuery && (
            <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
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
                    <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50">
                      <Link href={`/profile/${user.id}`}>
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                          <AvatarFallback>{user.name[0]}</AvatarFallback>
                        </Avatar>
                      </Link>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground truncate">{user.name}</span>
                          <Badge variant="secondary" className={cn("text-xs", level.color)}>
                            {level.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{user.region}</p>
                      </div>
                      {!isMe && (
                        <Button
                          size="sm"
                          variant={isFollowed ? "secondary" : "default"}
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
          )}
        </Card>

        {error ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{error}</p>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 bg-secondary">
              <TabsTrigger value="friends">친구</TabsTrigger>
              <TabsTrigger value="ranking">랭킹</TabsTrigger>
              <TabsTrigger value="recommend">추천</TabsTrigger>
              <TabsTrigger value="chat">채팅</TabsTrigger>
            </TabsList>

            {/* Friends Tab */}
            <TabsContent value="friends" className="mt-4 space-y-3">
              {followings.length > 0 ? (
                followings.map((user) => {
                  const level = getTasteLevel(user.tasteScore)
                  return (
                    <Card key={user.id} className="p-3 flex items-center gap-3 border border-border">
                      <Link href={`/profile/${user.id}`}>
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                          <AvatarFallback>{user.name[0]}</AvatarFallback>
                        </Avatar>
                      </Link>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Link href={`/profile/${user.id}`} className="font-semibold text-foreground hover:underline">
                            {user.name}
                          </Link>
                          <Badge variant="secondary" className={cn("text-xs", level.color)}>
                            {level.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span>{user.region}</span>
                          <span>·</span>
                          <span>{user.tasteScore.toLocaleString()}점</span>
                        </div>
                      </div>
                      <Link href={`/chat/${user.id}`}>
                        <Button variant="ghost" size="icon">
                          <MessageCircle className="h-5 w-5" />
                        </Button>
                      </Link>
                    </Card>
                  )
                })
              ) : (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-2">아직 친구가 없어요</p>
                  <p className="text-sm text-muted-foreground">추천 탭에서 비슷한 취향의 맛잘알을 찾아보세요!</p>
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
                        <Link href={`/chat/${user.id}`}>
                          <Button variant="outline">
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                        </Link>
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
            <TabsContent value="chat" className="mt-4 space-y-3">
              {chatRooms.length > 0 ? (
                chatRooms.map((room) => (
                  <Link key={room.id} href={`/chat/${room.otherUser.id}`}>
                    <Card className="p-3 flex items-center gap-3 hover:bg-secondary/50 transition-colors border border-border">
                      <div className="relative">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={room.otherUser.avatar || "/placeholder.svg"} alt={room.otherUser.name} />
                          <AvatarFallback>{room.otherUser.name[0]}</AvatarFallback>
                        </Avatar>
                        {room.unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 h-5 w-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                            {room.unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground">{room.otherUser.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(room.lastMessageAt).toLocaleDateString("ko-KR", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{room.lastMessage}</p>
                      </div>
                    </Card>
                  </Link>
                ))
              ) : (
                <div className="text-center py-12">
                  <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-2">아직 대화가 없어요</p>
                  <p className="text-sm text-muted-foreground">친구를 추가하고 대화를 시작해보세요!</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </MobileLayout>
  )
}
