"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Camera, Star, X, Sparkles, Search, MapPin } from "lucide-react"
import { MobileLayout } from "@/components/mobile-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { mockRestaurants } from "@/lib/mock-data"
import { KakaoMapSearch, KakaoPlace } from "@/components/kakao-map-search"
import { cn } from "@/lib/utils"

function WriteReviewContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const restaurantId = searchParams.get("restaurantId")

  const preselectedRestaurant = restaurantId ? mockRestaurants.find((r) => r.id === restaurantId) : null

  const [selectedRestaurant, setSelectedRestaurant] = useState(preselectedRestaurant)
  const [selectedKakaoPlace, setSelectedKakaoPlace] = useState<KakaoPlace | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchMode, setSearchMode] = useState<"app" | "kakao">("kakao")
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [content, setContent] = useState("")
  const [menu, setMenu] = useState("")
  const [price, setPrice] = useState("")
  const [images, setImages] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const filteredRestaurants = searchQuery
    ? mockRestaurants.filter(
        (r) => r.name.includes(searchQuery) || r.address.includes(searchQuery) || r.category.includes(searchQuery),
      )
    : []

  const isFirstReview = selectedRestaurant?.reviewCount === 0
  const hasSelectedPlace = selectedRestaurant || selectedKakaoPlace

  // 카카오 장소 선택 핸들러
  const handleKakaoPlaceSelect = (place: KakaoPlace) => {
    setSelectedKakaoPlace(place)
    setSelectedRestaurant(null)
  }

  // 장소 선택 초기화
  const clearSelectedPlace = () => {
    setSelectedRestaurant(null)
    setSelectedKakaoPlace(null)
  }

  const handleImageUpload = () => {
    // Simulating image upload
    const newImage = `/placeholder.svg?height=200&width=200&query=food-photo-${images.length + 1}`
    setImages([...images, newImage])
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!hasSelectedPlace || rating === 0 || !content || !menu) {
      alert("필수 항목을 모두 입력해주세요")
      return
    }

    setIsSubmitting(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // TODO: 카카오 장소 선택 시 백엔드에 새 음식점 등록 후 리뷰 작성
    // selectedKakaoPlace가 있으면 새 음식점으로 등록

    alert(isFirstReview ? "첫 리뷰 작성 완료! 맛잘알 점수가 2배로 적용됩니다!" : "리뷰가 등록되었습니다!")
    router.push("/")
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
          <h1 className="font-bold text-lg text-foreground">리뷰 작성</h1>
          <Button
            onClick={handleSubmit}
            disabled={!hasSelectedPlace || rating === 0 || !content || !menu || isSubmitting}
            className="bg-primary text-primary-foreground"
          >
            {isSubmitting ? "등록 중..." : "등록"}
          </Button>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* First Review Notice */}
        {isFirstReview && (
          <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-primary flex-shrink-0" />
            <div>
              <p className="font-semibold text-foreground">첫 리뷰 보너스!</p>
              <p className="text-sm text-muted-foreground">이 음식점의 첫 리뷰어가 되면 맛잘알 점수가 2배!</p>
            </div>
          </div>
        )}

        {/* Restaurant Selection */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">음식점 선택 *</label>

          {/* 선택된 음식점 표시 */}
          {selectedRestaurant ? (
            <Card className="p-3 flex items-center gap-3 border border-border">
              <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-muted">
                <Image
                  src={selectedRestaurant.thumbnail || "/placeholder.svg"}
                  alt={selectedRestaurant.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">{selectedRestaurant.name}</h3>
                  <Badge variant="outline" className="text-xs">
                    {selectedRestaurant.category}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{selectedRestaurant.address}</p>
                {selectedRestaurant.reviewCount === 0 && (
                  <Badge className="mt-1 bg-primary text-primary-foreground text-xs">첫 리뷰 가능</Badge>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={clearSelectedPlace}>
                <X className="h-4 w-4" />
              </Button>
            </Card>
          ) : selectedKakaoPlace ? (
            <Card className="p-3 border border-primary bg-primary/5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-foreground">{selectedKakaoPlace.name}</h3>
                    <Badge variant="outline" className="text-xs">
                      {selectedKakaoPlace.category.split(' > ').pop()}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedKakaoPlace.roadAddress || selectedKakaoPlace.address}
                  </p>
                  {selectedKakaoPlace.phone && (
                    <p className="text-xs text-muted-foreground">{selectedKakaoPlace.phone}</p>
                  )}
                  <Badge className="mt-2 bg-primary text-primary-foreground text-xs">
                    <Sparkles className="h-3 w-3 mr-1" />
                    첫 리뷰 가능
                  </Badge>
                </div>
                <Button variant="ghost" size="icon" onClick={clearSelectedPlace}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ) : (
            <Tabs value={searchMode} onValueChange={(v) => setSearchMode(v as "app" | "kakao")}>
              <TabsList className="grid w-full grid-cols-2 mb-3">
                <TabsTrigger value="kakao" className="gap-1">
                  <MapPin className="h-4 w-4" />
                  지도 검색
                </TabsTrigger>
                <TabsTrigger value="app" className="gap-1">
                  <Search className="h-4 w-4" />
                  앱 내 검색
                </TabsTrigger>
              </TabsList>

              <TabsContent value="kakao" className="mt-0">
                <KakaoMapSearch
                  onSelectPlace={handleKakaoPlaceSelect}
                  selectedPlace={selectedKakaoPlace}
                  onClear={clearSelectedPlace}
                />
              </TabsContent>

              <TabsContent value="app" className="mt-0 space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="등록된 음식점 검색"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {filteredRestaurants.length > 0 && (
                  <div className="bg-card border border-border rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                    {filteredRestaurants.map((restaurant) => (
                      <button
                        key={restaurant.id}
                        className="w-full p-3 flex items-center gap-3 hover:bg-secondary transition-colors text-left border-b border-border last:border-0"
                        onClick={() => {
                          setSelectedRestaurant(restaurant)
                          setSelectedKakaoPlace(null)
                          setSearchQuery("")
                        }}
                      >
                        <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-muted">
                          <Image
                            src={restaurant.thumbnail || "/placeholder.svg"}
                            alt={restaurant.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{restaurant.name}</span>
                            {restaurant.reviewCount === 0 && (
                              <Badge className="bg-primary text-primary-foreground text-xs">첫 리뷰</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{restaurant.address}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {searchQuery && filteredRestaurants.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    검색 결과가 없습니다. 지도 검색을 이용해보세요.
                  </p>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>

        {/* Rating */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">평점 *</label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={cn(
                    "h-8 w-8 transition-colors",
                    star <= (hoverRating || rating) ? "fill-primary text-primary" : "fill-muted text-muted",
                  )}
                />
              </button>
            ))}
            {rating > 0 && <span className="ml-2 text-lg font-semibold text-foreground">{rating}점</span>}
          </div>
        </div>

        {/* Menu & Price */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">메뉴 *</label>
            <Input placeholder="주문한 메뉴" value={menu} onChange={(e) => setMenu(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">가격</label>
            <Input placeholder="예: 12,000원" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
        </div>

        {/* Images */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">사진 (최대 5장)</label>
          <div className="flex gap-2 flex-wrap">
            {images.map((image, index) => (
              <div key={index} className="relative h-20 w-20 rounded-lg overflow-hidden bg-muted">
                <Image
                  src={image || "/placeholder.svg"}
                  alt={`업로드 이미지 ${index + 1}`}
                  fill
                  className="object-cover"
                />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 bg-background/80 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {images.length < 5 && (
              <button
                onClick={handleImageUpload}
                className="h-20 w-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                <Camera className="h-6 w-6" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">리뷰 내용 *</label>
          <Textarea
            placeholder="음식의 맛, 분위기, 서비스 등 솔직한 후기를 남겨주세요"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground mt-1">{content.length}/500자</p>
        </div>

        {/* Guidelines */}
        <div className="bg-secondary/50 rounded-xl p-4">
          <h4 className="font-medium text-foreground mb-2 text-sm">리뷰 작성 가이드</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• 직접 방문한 경험을 솔직하게 작성해주세요</li>
            <li>• 광고성 리뷰나 허위 리뷰는 삭제될 수 있습니다</li>
            <li>• 첫 리뷰 작성 시 맛잘알 점수가 2배로 적용됩니다</li>
            <li>• 공감을 많이 받을수록 맛잘알 점수가 올라갑니다</li>
          </ul>
        </div>
      </div>
    </MobileLayout>
  )
}

export default function WriteReviewPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">로딩 중...</div>}>
      <WriteReviewContent />
    </Suspense>
  )
}
