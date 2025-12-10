"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, MapPin, MessageCircle, UserPlus, Loader2 } from "lucide-react"
import { MobileLayout } from "@/components/mobile-layout"
import { TasteScoreCard } from "@/components/taste-score-card"
import { ReviewCard } from "@/components/review-card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { api, User, Review } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"

export function ProfileClient({ id }: { id: string }) {
  const { user: currentUser } = useAuth()
  const [user, setUser] = useState<User | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [isFollowing, setIsFollowing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isOwnProfile = currentUser && user && currentUser.id === user.id

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const userId = Number(id)
        const [userResult, reviewsResult] = await Promise.all([
          api.getUser(userId),
          api.getUserReviews(userId),
        ])

        if (userResult.success) {
          setUser(userResult.data)
        }
        if (reviewsResult.success) {
          setReviews(reviewsResult.data.content)
        }

        // Check if following
        if (currentUser && currentUser.id !== userId) {
          try {
            const followResult = await api.isFollowing(userId)
            if (followResult.success) {
              setIsFollowing(followResult.data)
            }
          } catch (err) {
            // Ignore follow check error
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
      console.error("팔로우 처리 실패:", err)
      alert("팔로우 처리에 실패했습니다")
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
          <div className="w-10" />
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
                {isFollowing ? "팔로잉" : "맛잘알 친구 추가"}
              </Button>
              <Link href={`/chat/${user.id}`}>
                <Button variant="outline">
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}
        </Card>

        {/* Taste Score Card */}
        <TasteScoreCard user={user} />

        {/* User Reviews */}
        <div>
          <h3 className="font-semibold text-foreground mb-3">작성한 리뷰 ({reviews.length})</h3>
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
        </div>
      </div>
    </MobileLayout>
  )
}
