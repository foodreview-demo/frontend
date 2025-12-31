"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Sparkles, MessageCircle, UserPlus, MapPin, Users, Loader2,
  Trophy, Search, UserCheck
} from "lucide-react"
import { MobileLayout } from "@/components/mobile-layout"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api, RecommendedUser, User } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "@/lib/i18n-context"
import { cn } from "@/lib/utils"
import { getTasteLevel } from "@/lib/constants"

export default function FollowsPage() {
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const t = useTranslation()
  const [activeTab, setActiveTab] = useState("following")
  const [recommendations, setRecommendations] = useState<RecommendedUser[]>([])
  const [followingList, setFollowingList] = useState<User[]>([])
  const [followerList, setFollowerList] = useState<User[]>([])
  const [followingIds, setFollowingIds] = useState<Set<number>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) {
        setIsLoading(false)
        return
      }
      setIsLoading(true)
      setError(null)
      try {
        const [recResult, followingResult, followerResult] = await Promise.all([
          api.getRecommendedFriends(),
          api.getFollowings(currentUser.id),
          api.getFollowers(currentUser.id),
        ])

        if (recResult.success) setRecommendations(recResult.data)
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

  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }
    setIsSearching(true)
    try {
      // TODO: 사용자 검색 API가 추가되면 여기서 호출
      // 현재는 추천 목록에서 필터링하여 mock 검색
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
          <h1 className="text-xl font-bold text-foreground">{t.nav.friends}</h1>
          <div className="flex items-center gap-1">
            <Link href="/ranking">
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
                <Trophy className="h-4 w-4" />
                {t.nav.ranking}
              </Button>
            </Link>
          </div>
        </div>
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t.follows.searchUsers}
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
              <p className="text-center text-sm text-muted-foreground py-4">{t.restaurant.noResults}</p>
            )}
          </div>
        </div>
      )}

      <div className="p-4 space-y-4">
        {error ? (
          <div className="text-center py-12"><p className="text-muted-foreground">{error}</p></div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 bg-secondary/50 p-1 rounded-xl">
              <TabsTrigger value="following" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">{t.profile.following}</TabsTrigger>
              <TabsTrigger value="follower" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">{t.profile.followers}</TabsTrigger>
              <TabsTrigger value="recommend" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">{t.follows.recommend}</TabsTrigger>
            </TabsList>

            <TabsContent value="following" className="mt-4 space-y-2">
              {renderUserList(followingList, t.follows.noFollowing, t.follows.noFollowingDesc, true)}
            </TabsContent>

            <TabsContent value="follower" className="mt-4 space-y-2">
              {renderUserList(followerList, t.follows.noFollowers, t.follows.noFollowersDesc, false)}
            </TabsContent>

            <TabsContent value="recommend" className="mt-4 space-y-3">
              <Card className="p-4 bg-primary/5 border-primary/20">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center"><Sparkles className="h-5 w-5 text-primary" /></div>
                  <div>
                    <h3 className="font-semibold text-foreground">{t.follows.aiRecommend}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t.follows.aiRecommendDesc}
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
                          {isFollowing ? <><UserCheck className="h-4 w-4 mr-2" />{t.profile.following}</> : <><UserPlus className="h-4 w-4 mr-2" />{t.profile.follow}</>}
                        </Button>
                        <Button variant="outline" onClick={() => handleStartChat(user.id)}><MessageCircle className="h-4 w-4" /></Button>
                      </div>
                    </Card>
                  )
                })
              ) : (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">{t.follows.noRecommend}</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </MobileLayout>
  )
}
