"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, MapPin, MessageCircle, UserPlus } from "lucide-react"
import { MobileLayout } from "@/components/mobile-layout"
import { TasteScoreCard } from "@/components/taste-score-card"
import { ReviewCard } from "@/components/review-card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { mockUsers, mockReviews, currentUser } from "@/lib/mock-data"

export function ProfileClient({ id }: { id: string }) {
  const [isFollowing, setIsFollowing] = useState(false)

  const user = mockUsers.find((u) => u.id === id) || mockUsers[0]
  const userReviews = mockReviews.filter((r) => r.userId === id)
  const isOwnProfile = user.id === currentUser.id

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
                onClick={() => setIsFollowing(!isFollowing)}
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
          <h3 className="font-semibold text-foreground mb-3">작성한 리뷰 ({userReviews.length})</h3>
          {userReviews.length > 0 ? (
            <div className="space-y-4">
              {userReviews.map((review) => (
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
