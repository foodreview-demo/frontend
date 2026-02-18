"use client"

import { useState } from "react"
import { Sparkles, ChevronRight, Loader2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { api, RecommendationResponse, TimeSlotLabels } from "@/lib/api"
import { AiRecommendationSheet } from "./ai-recommendation-sheet"

interface AiRecommendationCardProps {
  onRestaurantClick?: (kakaoPlaceId: string) => void
}

export function AiRecommendationCard({ onRestaurantClick }: AiRecommendationCardProps) {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [recommendation, setRecommendation] = useState<RecommendationResponse | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const handleClick = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      // 현재 위치 가져오기 (선택적)
      let latitude: number | undefined
      let longitude: number | undefined

      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
          })
          latitude = position.coords.latitude
          longitude = position.coords.longitude
        } catch {
          // 위치 정보 없이 진행
        }
      }

      const result = await api.getTodayRecommendation(latitude, longitude)
      if (result.success) {
        setRecommendation(result.data)
        setIsSheetOpen(true)
      }
    } catch (err) {
      console.error("추천 로드 실패:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAsk = async (query: string) => {
    if (!user) return

    setIsLoading(true)
    try {
      const result = await api.askRecommendation(query)
      if (result.success) {
        setRecommendation(result.data)
      }
    } catch (err) {
      console.error("추천 로드 실패:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFeedback = async (feedback: number) => {
    if (!recommendation?.cacheId) return
    try {
      await api.saveRecommendationFeedback(recommendation.cacheId, feedback)
    } catch (err) {
      console.error("피드백 저장 실패:", err)
    }
  }

  // 현재 시간대 표시
  const getCurrentTimeSlot = (): string => {
    const hour = new Date().getHours()
    if (hour >= 6 && hour <= 10) return "morning"
    if (hour >= 11 && hour <= 14) return "lunch"
    if (hour >= 17 && hour <= 21) return "dinner"
    if (hour >= 22 || hour < 6) return "lateNight"
    return "afternoon"
  }

  const timeSlot = getCurrentTimeSlot()
  const timeSlotLabel = TimeSlotLabels[timeSlot] || "오늘"

  if (!user) return null

  return (
    <>
      <Card
        className="mx-4 mt-4 p-4 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 cursor-pointer hover:shadow-md transition-shadow"
        onClick={handleClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              {isLoading ? (
                <Loader2 className="h-5 w-5 text-primary animate-spin" />
              ) : (
                <Sparkles className="h-5 w-5 text-primary" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                {timeSlotLabel} 뭐 먹지?
              </h3>
              <p className="text-sm text-muted-foreground">
                AI가 취향에 맞는 맛집을 추천해드려요
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </Card>

      <AiRecommendationSheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        recommendation={recommendation}
        isLoading={isLoading}
        onAsk={handleAsk}
        onFeedback={handleFeedback}
        onRestaurantClick={onRestaurantClick}
      />
    </>
  )
}
