"use client"

import { useState, useEffect } from "react"
import { MobileLayout } from "@/components/mobile-layout"
import { HomeHeader } from "@/components/home-header"
import { CategoryFilter } from "@/components/category-filter"
import { ReviewCard } from "@/components/review-card"
import { api, Review } from "@/lib/api"
import { mockReviews } from "@/lib/mock-data"
import { Loader2 } from "lucide-react"

export default function HomePage() {
  const [selectedRegion, setSelectedRegion] = useState("전체")
  const [selectedCategory, setSelectedCategory] = useState("전체")
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [useMock, setUseMock] = useState(false)

  useEffect(() => {
    const fetchReviews = async () => {
      setIsLoading(true)
      try {
        const result = await api.getReviews(
          selectedRegion !== "전체" ? selectedRegion : undefined,
          selectedCategory !== "전체" ? selectedCategory : undefined
        )
        if (result.success) {
          setReviews(result.data.content)
          setUseMock(false)
        }
      } catch (error) {
        console.error("리뷰 로드 실패, 목업 데이터 사용:", error)
        setUseMock(true)
      } finally {
        setIsLoading(false)
      }
    }

    fetchReviews()
  }, [selectedRegion, selectedCategory])

  // 목업 데이터 사용 시 필터링
  const filteredMockReviews = mockReviews.filter((review) => {
    const regionMatch = selectedRegion === "전체" || review.restaurant.region === selectedRegion
    const categoryMatch = selectedCategory === "전체" || review.restaurant.category === selectedCategory
    return regionMatch && categoryMatch
  })

  const displayReviews = useMock ? filteredMockReviews : reviews

  // 목업 데이터를 API 형식으로 변환
  const convertedReviews = useMock
    ? displayReviews.map((r) => ({
        ...r,
        id: Number(r.id),
        user: {
          ...r.user,
          id: Number(r.user.id),
          tasteGrade: getTasteGrade(r.user.tasteScore),
        },
        restaurant: {
          ...r.restaurant,
          id: Number(r.restaurant.id),
          categoryDisplay: r.restaurant.category,
        },
      }))
    : displayReviews

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
        ) : convertedReviews.length > 0 ? (
          convertedReviews.map((review) => <ReviewCard key={review.id} review={review as any} />)
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">해당 조건의 리뷰가 없습니다</p>
          </div>
        )}
      </div>
    </MobileLayout>
  )
}

function getTasteGrade(score: number): string {
  if (score >= 2000) return "마스터"
  if (score >= 1500) return "전문가"
  if (score >= 1000) return "미식가"
  if (score >= 500) return "탐험가"
  return "입문자"
}
