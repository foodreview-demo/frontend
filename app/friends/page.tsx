"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Sparkles, MessageCircle, UserPlus, MapPin, Check, Users } from "lucide-react"
import { MobileLayout } from "@/components/mobile-layout"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { mockUsers, currentUser, mockChatRooms } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

function getTasteLevel(score: number): { label: string; color: string } {
  if (score >= 2000) return { label: "마스터", color: "bg-primary text-primary-foreground" }
  if (score >= 1500) return { label: "전문가", color: "bg-accent text-accent-foreground" }
  if (score >= 1000) return { label: "미식가", color: "bg-secondary text-secondary-foreground" }
  if (score >= 500) return { label: "탐험가", color: "bg-muted text-muted-foreground" }
  return { label: "입문자", color: "bg-muted text-muted-foreground" }
}

interface RecommendedFriend {
  user: (typeof mockUsers)[0]
  matchReason: string
  matchScore: number
  sharedCategories: string[]
}

// Generate recommendations based on shared interests
const generateRecommendations = (): RecommendedFriend[] => {
  return mockUsers
    .filter((u) => u.id !== currentUser.id)
    .map((user) => {
      const sharedCategories = user.favoriteCategories.filter((c) => currentUser.favoriteCategories.includes(c))
      const regionMatch = user.region === currentUser.region
      const scoreMatch = Math.abs(user.tasteScore - currentUser.tasteScore) < 500

      let matchScore = sharedCategories.length * 30
      if (regionMatch) matchScore += 25
      if (scoreMatch) matchScore += 15

      let matchReason = ""
      if (sharedCategories.length >= 2) {
        matchReason = `${sharedCategories.slice(0, 2).join(", ")} 취향이 비슷해요`
      } else if (regionMatch) {
        matchReason = "같은 지역에서 활동해요"
      } else {
        matchReason = "비슷한 맛잘알 점수대예요"
      }

      return {
        user,
        matchReason,
        matchScore,
        sharedCategories,
      }
    })
    .sort((a, b) => b.matchScore - a.matchScore)
}

export default function FriendsPage() {
  const [activeTab, setActiveTab] = useState("recommend")
  const [followedIds, setFollowedIds] = useState<string[]>([])

  const recommendations = generateRecommendations()
  const myFriends = mockUsers.filter((u) => followedIds.includes(u.id))

  const handleFollow = (userId: string) => {
    if (followedIds.includes(userId)) {
      setFollowedIds(followedIds.filter((id) => id !== userId))
    } else {
      setFollowedIds([...followedIds, userId])
    }
  }

  return (
    <MobileLayout>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link href="/profile">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold text-foreground">맛잘알 친구</h1>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* AI Recommendation Banner */}
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">맛잘알 친구 추천</h3>
              <p className="text-sm text-muted-foreground mt-1">
                당신의 <span className="text-primary font-medium">맛잘알 점수, 지역, 공감한 음식점</span>을 분석해서
                비슷한 취향의 맛잘알을 추천해드려요!
              </p>
            </div>
          </div>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 bg-secondary">
            <TabsTrigger value="recommend">추천</TabsTrigger>
            <TabsTrigger value="friends">내 친구</TabsTrigger>
            <TabsTrigger value="chat">채팅</TabsTrigger>
          </TabsList>

          {/* Recommendations Tab */}
          <TabsContent value="recommend" className="mt-4 space-y-3">
            {recommendations.map(({ user, matchReason, matchScore, sharedCategories }) => {
              const level = getTasteLevel(user.tasteScore)
              const isFollowed = followedIds.includes(user.id)

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
                        <span className="text-sm text-primary font-medium">{matchReason}</span>
                      </div>
                      {sharedCategories.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {sharedCategories.map((cat) => (
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
            })}
          </TabsContent>

          {/* My Friends Tab */}
          <TabsContent value="friends" className="mt-4 space-y-3">
            {myFriends.length > 0 ? (
              myFriends.map((user) => {
                const level = getTasteLevel(user.tasteScore)
                return (
                  <Link key={user.id} href={`/profile/${user.id}`}>
                    <Card className="p-3 flex items-center gap-3 hover:bg-secondary/50 transition-colors border border-border">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                        <AvatarFallback>{user.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">{user.name}</span>
                          <Badge variant="secondary" className={cn("text-xs", level.color)}>
                            {level.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{user.region}</p>
                      </div>
                      <Link href={`/chat/${user.id}`}>
                        <Button variant="ghost" size="icon">
                          <MessageCircle className="h-5 w-5" />
                        </Button>
                      </Link>
                    </Card>
                  </Link>
                )
              })
            ) : (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">아직 맛잘알 친구가 없어요</p>
                <p className="text-sm text-muted-foreground">추천 탭에서 비슷한 취향의 맛잘알을 찾아보세요!</p>
              </div>
            )}
          </TabsContent>

          {/* Chat Tab */}
          <TabsContent value="chat" className="mt-4 space-y-3">
            {mockChatRooms.map((room) => {
              const otherUser = room.participants.find((p) => p.id !== currentUser.id)
              if (!otherUser) return null

              return (
                <Link key={room.id} href={`/chat/${otherUser.id}`}>
                  <Card className="p-3 flex items-center gap-3 hover:bg-secondary/50 transition-colors border border-border">
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={otherUser.avatar || "/placeholder.svg"} alt={otherUser.name} />
                        <AvatarFallback>{otherUser.name[0]}</AvatarFallback>
                      </Avatar>
                      {room.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                          {room.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground">{otherUser.name}</span>
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
              )
            })}

            {mockChatRooms.length === 0 && (
              <div className="text-center py-12">
                <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">아직 대화가 없어요</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MobileLayout>
  )
}
