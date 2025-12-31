"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ArrowLeft, MapPin, MessageCircle, UserPlus, Loader2, ListMusic, Star, ChevronRight, MoreVertical, UserX, AlertTriangle } from "lucide-react"
import { MobileLayout } from "@/components/mobile-layout"
import { TasteScoreCard } from "@/components/taste-score-card"
import { ReviewCard } from "@/components/review-card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { api, User, Review, Playlist } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"

export function ProfileClient({ id }: { id: string }) {
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const [user, setUser] = useState<User | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [isFollowing, setIsFollowing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("reviews")
  const [showBlockDialog, setShowBlockDialog] = useState(false)
  const [isBlocking, setIsBlocking] = useState(false)
  const [isBlocked, setIsBlocked] = useState(false)

  const isOwnProfile = currentUser && user && currentUser.id === user.id

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const userId = Number(id)
        const [userResult, reviewsResult, playlistsResult] = await Promise.all([
          api.getUser(userId),
          api.getUserReviews(userId),
          api.getUserPublicPlaylists(userId),
        ])

        if (userResult.success) {
          setUser(userResult.data)
        }
        if (reviewsResult.success) {
          setReviews(reviewsResult.data.content)
        }
        if (playlistsResult.success) {
          setPlaylists(playlistsResult.data.content)
        }

        // Check if following and blocked
        if (currentUser && currentUser.id !== userId) {
          try {
            const [followResult, blockedResult] = await Promise.all([
              api.isFollowing(userId),
              api.isBlocked(userId),
            ])
            if (followResult.success) {
              setIsFollowing(followResult.data)
            }
            if (blockedResult.success) {
              setIsBlocked(blockedResult.data)
            }
          } catch (err) {
            // Ignore check error
          }
        }
      } catch (err) {
        console.error("프로필 로드 실패:", err)
        setError("프로필을 불러오는데 실패했습니다")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [id, currentUser])

  const handleFollow = async () => {
    if (!user) return
    try {
      if (isFollowing) {
        await api.unfollow(user.id)
        setIsFollowing(false)
      } else {
        await api.follow(user.id)
        setIsFollowing(true)
      }
    } catch (err) {
      console.error("친구 추가 처리 실패:", err)
      alert("친구 추가 처리에 실패했습니다")
    }
  }

  const handleStartChat = async () => {
    if (!user) return
    try {
      const result = await api.getOrCreateChatRoom(user.id)
      if (result.success && result.data.uuid) {
        router.push(`/chat?room=${result.data.uuid}`)
      } else {
        console.error("UUID가 없음:", result)
        alert("채팅방을 열 수 없습니다")
      }
    } catch (err: any) {
      console.error("채팅방 생성 실패:", err)
      if (err?.message?.includes("차단")) {
        alert("차단된 사용자와는 채팅할 수 없습니다")
      } else {
        alert("채팅방을 열 수 없습니다")
      }
    }
  }

  const handleBlock = async () => {
    if (!user) return
    setIsBlocking(true)
    try {
      if (isBlocked) {
        await api.unblockUser(user.id)
        setIsBlocked(false)
        setShowBlockDialog(false)
        alert("차단을 해제했습니다")
      } else {
        await api.blockUser(user.id)
        setIsBlocked(true)
        setIsFollowing(false)
        setShowBlockDialog(false)
        alert("사용자를 차단했습니다")
      }
    } catch (err) {
      console.error("차단 처리 실패:", err)
      alert("처리에 실패했습니다")
    } finally {
      setIsBlocking(false)
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

  if (error || !user) {
    return (
      <MobileLayout>
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <p className="text-muted-foreground">{error || "사용자를 찾을 수 없습니다"}</p>
          <Link href="/">
            <Button className="mt-4">홈으로 돌아가기</Button>
          </Link>
        </div>
      </MobileLayout>
    )
  }

  return (
    <MobileLayout>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="font-bold text-lg text-foreground">{user.name}</h1>
          {!isOwnProfile ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className={isBlocked ? "" : "text-destructive focus:text-destructive"}
                  onClick={() => setShowBlockDialog(true)}
                >
                  <UserX className="h-4 w-4 mr-2" />
                  {isBlocked ? "차단 해제" : "차단하기"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="w-10" />
          )}
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Profile Header */}
        <Card className="p-4 border border-border">
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20 ring-4 ring-primary/20">
              <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
              <AvatarFallback>{user.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-foreground">{user.name}</h2>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <MapPin className="h-4 w-4" />
                <span>{user.region}</span>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {user.favoriteCategories.map((category) => (
                  <Badge key={category} variant="secondary" className="text-xs">
                    {category}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {!isOwnProfile && (
            <div className="flex gap-2 mt-4">
              <Button
                className={`flex-1 ${
                  isFollowing ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground"
                }`}
                onClick={handleFollow}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                {isFollowing ? "친구 추가됨" : "맛잘알 친구 추가"}
              </Button>
              <Button variant="outline" onClick={handleStartChat}>
                <MessageCircle className="h-4 w-4" />
              </Button>
            </div>
          )}
        </Card>

        {/* Taste Score Card */}
        <TasteScoreCard user={user} />

        {/* Tabs: Reviews & Playlists */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 bg-secondary/50 p-1 rounded-xl">
            <TabsTrigger value="reviews" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              리뷰 ({reviews.length})
            </TabsTrigger>
            <TabsTrigger value="playlists" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              맛집 리스트 ({playlists.length})
            </TabsTrigger>
          </TabsList>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="mt-4">
            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center border border-border">
                <p className="text-muted-foreground">아직 작성한 리뷰가 없어요</p>
              </Card>
            )}
          </TabsContent>

          {/* Playlists Tab */}
          <TabsContent value="playlists" className="mt-4">
            {playlists.length > 0 ? (
              <div className="space-y-3">
                {playlists.map((playlist) => (
                  <Link key={playlist.id} href={`/playlist?id=${playlist.id}`}>
                    <Card className="p-4 border border-border hover:bg-secondary/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <ListMusic className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-foreground truncate">{playlist.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {playlist.itemCount}개 맛집
                          </p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center border border-border">
                <ListMusic className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">공개된 맛집 리스트가 없어요</p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* 차단 확인 다이얼로그 */}
      <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {isBlocked ? "차단 해제" : "사용자 차단"}
            </DialogTitle>
            <DialogDescription asChild>
              <div>
                {isBlocked ? (
                  <>
                    <strong>{user.name}</strong>님의 차단을 해제하시겠습니까?
                    <ul className="list-disc pl-5 mt-3 space-y-1">
                      <li>이 사용자의 리뷰가 피드에 다시 표시됩니다</li>
                      <li>이 사용자와 다시 채팅할 수 있습니다</li>
                      <li>팔로우는 자동으로 복구되지 않습니다</li>
                    </ul>
                  </>
                ) : (
                  <>
                    <strong>{user.name}</strong>님을 차단하시겠습니까?
                    <ul className="list-disc pl-5 mt-3 space-y-1">
                      <li>이 사용자의 리뷰가 피드에 표시되지 않습니다</li>
                      <li>이 사용자의 채팅 메시지를 받을 수 없습니다</li>
                      <li>서로 팔로우 관계가 해제됩니다</li>
                    </ul>
                  </>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBlockDialog(false)}>
              취소
            </Button>
            <Button
              variant={isBlocked ? "default" : "destructive"}
              onClick={handleBlock}
              disabled={isBlocking}
            >
              {isBlocking ? "처리 중..." : isBlocked ? "차단 해제" : "차단하기"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  )
}
