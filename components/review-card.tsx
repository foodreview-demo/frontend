"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Heart, MessageCircle, Star, Sparkles } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Review } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

interface ReviewCardProps {
  review: Review
}

function getTasteLevel(score: number): { label: string; color: string } {
  if (score >= 2000) return { label: "마스터", color: "bg-primary text-primary-foreground" }
  if (score >= 1500) return { label: "전문가", color: "bg-accent text-accent-foreground" }
  if (score >= 1000) return { label: "미식가", color: "bg-secondary text-secondary-foreground" }
  if (score >= 500) return { label: "탐험가", color: "bg-muted text-muted-foreground" }
  return { label: "입문자", color: "bg-muted text-muted-foreground" }
}

export function ReviewCard({ review }: ReviewCardProps) {
  const [sympathyCount, setSympathyCount] = useState(review.sympathyCount)
  const [hasSympathized, setHasSympathized] = useState(review.hasSympathized)

  const tasteLevel = getTasteLevel(review.user.tasteScore)

  const handleSympathy = () => {
    if (hasSympathized) {
      setSympathyCount((prev) => prev - 1)
    } else {
      setSympathyCount((prev) => prev + 1)
    }
    setHasSympathized(!hasSympathized)
  }

  return (
    <Card className="overflow-hidden border-0 shadow-sm bg-card">
      {/* User Header */}
      <div className="p-4 flex items-center gap-3">
        <Link href={`/profile/${review.user.id}`}>
          <Avatar className="h-10 w-10 ring-2 ring-primary/20">
            <AvatarImage src={review.user.avatar || "/placeholder.svg"} alt={review.user.name} />
            <AvatarFallback>{review.user.name[0]}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Link href={`/profile/${review.user.id}`} className="font-semibold text-foreground hover:underline">
              {review.user.name}
            </Link>
            <Badge variant="secondary" className={cn("text-xs", tasteLevel.color)}>
              {tasteLevel.label}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {review.user.region} · 맛잘알 점수 {review.user.tasteScore.toLocaleString()}
          </p>
        </div>
        {review.isFirstReview && (
          <Badge className="bg-primary text-primary-foreground gap-1">
            <Sparkles className="h-3 w-3" />첫 리뷰
          </Badge>
        )}
      </div>

      {/* Restaurant Info */}
      <Link href={`/restaurant/${review.restaurant.id}`}>
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg text-foreground">{review.restaurant.name}</h3>
            <Badge variant="outline" className="text-xs">
              {review.restaurant.category}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{review.restaurant.address}</p>
        </div>
      </Link>

      {/* Review Image */}
      {review.images.length > 0 && (
        <div className="relative aspect-[4/3] bg-muted">
          <Image
            src={review.images[0] || "/placeholder.svg"}
            alt={`${review.restaurant.name} 리뷰 이미지`}
            fill
            className="object-cover"
          />
        </div>
      )}

      {/* Review Content */}
      <div className="p-4">
        {/* Rating & Menu */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn("h-4 w-4", i < review.rating ? "fill-primary text-primary" : "fill-muted text-muted")}
              />
            ))}
          </div>
          <span className="text-sm font-medium text-foreground">{review.menu}</span>
          <span className="text-sm text-muted-foreground">{review.price}</span>
        </div>

        {/* Content */}
        <p className="text-foreground leading-relaxed mb-4">{review.content}</p>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className={cn("gap-2 px-0 hover:bg-transparent", hasSympathized ? "text-primary" : "text-muted-foreground")}
            onClick={handleSympathy}
          >
            <Heart className={cn("h-5 w-5", hasSympathized && "fill-primary")} />
            <span className="font-semibold">{sympathyCount}</span>
            <span className="text-sm">공감</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 px-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
          >
            <MessageCircle className="h-5 w-5" />
            <span className="text-sm">댓글</span>
          </Button>
        </div>

        {/* Date */}
        <p className="text-xs text-muted-foreground mt-3">
          방문일 {review.visitDate} · 작성일 {review.createdAt}
        </p>
      </div>
    </Card>
  )
}
