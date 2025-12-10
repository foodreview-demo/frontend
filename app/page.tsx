"use client"

import { useState, useEffect } from "react"
import { MobileLayout } from "@/components/mobile-layout"
import { HomeHeader } from "@/components/home-header"
import { CategoryFilter } from "@/components/category-filter"
import { ReviewCard } from "@/components/review-card"
import { api, Review } from "@/lib/api"
import { Loader2 } from "lucide-react"

export default function HomePage() {
  const [selectedRegion, setSelectedRegion] = useState("전체")
  const [selectedCategory, setSelectedCategory] = useState("전체")
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchReviews = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const result = await api.getReviews(
          selectedRegion !== "전체" ? selectedRegion : undefined,
          selectedCategory !== "전체" ? selectedCategory : undefined
        )
        if (result.success) {
          setReviews(result.data.content)
        }
      } catch (err) {
        console.error("리뷰 로드 실패:", err)
        setError("리뷰를 불러오는데 실패했습니다")
      } finally {
        setIsLoading(false)
      }
    }

    fetchReviews()
  }, [selectedRegion, selectedCategory])

  return (
    <MobileLayout>
      <HomeHeader selectedRegion={selectedRegion} onRegionChange={setSelectedRegion} />
      <CategoryFilter selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} />

      <div className="p-4 space-y-4">
        {/* Trust Banner */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
          <p className="text-sm text-foreground font-medium text-center">
            🍽️ 맛잘알은 <span className="text-primary font-bold">광고와 AI 리뷰가 없습니다</span>
          </p>
          <p className="text-xs text-muted-foreground text-center mt-1">오직 진짜 맛잘알들의 솔직한 리뷰만 있어요</p>
        </div>

        {/* Reviews Feed */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{error}</p>
          </div>
        ) : reviews.length > 0 ? (
          reviews.map((review) => <ReviewCard key={review.id} review={review} />)
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">해당 조건의 리뷰가 없습니다</p>
          </div>
        )}
      </div>
    </MobileLayout>
  )
}
