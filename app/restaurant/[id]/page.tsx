"use client"

import { use, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, MapPin, Star, Clock, Sparkles, Share2 } from "lucide-react"
import { MobileLayout } from "@/components/mobile-layout"
import { ReviewCard } from "@/components/review-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { mockRestaurants, mockReviews } from "@/lib/mock-data"

export default function RestaurantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [activeTab, setActiveTab] = useState("reviews")

  const restaurant = mockRestaurants.find((r) => r.id === id) || mockRestaurants[0]
  const reviews = mockReviews.filter((r) => r.restaurantId === id)
  const isFirstReviewAvailable = restaurant.reviewCount === 0

  return (
    <MobileLayout>
      {/* Header Image */}
      <div className="relative h-64 bg-muted">
        <Image src={restaurant.thumbnail || "/placeholder.svg"} alt={restaurant.name} fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />

        {/* Back Button */}
        <Link href="/">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 left-4 bg-background/50 backdrop-blur-sm rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>

        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 bg-background/50 backdrop-blur-sm rounded-full"
        >
          <Share2 className="h-5 w-5" />
        </Button>

        {/* First Review Badge */}
        {isFirstReviewAvailable && (
          <Badge className="absolute top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground gap-1">
            <Sparkles className="h-3 w-3" />첫 리뷰 도전 가능!
          </Badge>
        )}
      </div>

      {/* Restaurant Info */}
      <div className="p-4 -mt-8 relative z-10">
        <div className="bg-card rounded-xl p-4 shadow-lg border border-border">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-foreground">{restaurant.name}</h1>
                <Badge variant="outline">{restaurant.category}</Badge>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
                <MapPin className="h-4 w-4" />
                <span>{restaurant.address}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-1">
              <Star className="h-5 w-5 fill-primary text-primary" />
              <span className="font-bold text-lg text-foreground">{restaurant.averageRating}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              리뷰 <span className="font-semibold text-foreground">{restaurant.reviewCount}</span>개
            </div>
            <div className="text-sm text-muted-foreground">{restaurant.priceRange}</div>
          </div>

          {/* Write Review Button */}
          <Link href={`/write?restaurantId=${id}`}>
            <Button className="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/90">
              {isFirstReviewAvailable ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />첫 리뷰 작성하기 (점수 2배!)
                </>
              ) : (
                "리뷰 작성하기"
              )}
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="px-4">
        <TabsList className="grid w-full grid-cols-2 bg-secondary">
          <TabsTrigger value="reviews">리뷰 ({reviews.length})</TabsTrigger>
          <TabsTrigger value="info">정보</TabsTrigger>
        </TabsList>

        <TabsContent value="reviews" className="mt-4 space-y-4 pb-4">
          {reviews.length > 0 ? (
            reviews.map((review) => <ReviewCard key={review.id} review={review} />)
          ) : (
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <Sparkles className="h-12 w-12 mx-auto text-primary mb-4" />
              <h3 className="font-bold text-lg text-foreground mb-2">아직 리뷰가 없어요!</h3>
              <p className="text-muted-foreground text-sm mb-4">첫 번째 리뷰어가 되어 맛잘알 점수를 2배로 받으세요</p>
              <Link href={`/write?restaurantId=${id}`}>
                <Button className="bg-primary text-primary-foreground">첫 리뷰 도전하기</Button>
              </Link>
            </div>
          )}
        </TabsContent>

        <TabsContent value="info" className="mt-4 space-y-4 pb-4">
          <div className="bg-card rounded-xl p-4 border border-border">
            <h3 className="font-semibold text-foreground mb-3">영업 정보</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>매일 10:00 - 22:00</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{restaurant.address}</span>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl p-4 border border-border">
            <h3 className="font-semibold text-foreground mb-3">가격대</h3>
            <p className="text-muted-foreground text-sm">{restaurant.priceRange}</p>
          </div>
        </TabsContent>
      </Tabs>
    </MobileLayout>
  )
}
