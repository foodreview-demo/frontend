"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Sparkles,
  MapPin,
  Star,
  Loader2,
  Send,
  ThumbsUp,
  ThumbsDown,
  ChevronRight
} from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { RecommendationResponse, RecommendationRestaurant, TimeSlotLabels } from "@/lib/api"
import { cn } from "@/lib/utils"

interface AiRecommendationSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  recommendation: RecommendationResponse | null
  isLoading: boolean
  onAsk: (query: string) => Promise<void>
  onFeedback: (feedback: number) => Promise<void>
  onRestaurantClick?: (kakaoPlaceId: string) => void
}

export function AiRecommendationSheet({
  open,
  onOpenChange,
  recommendation,
  isLoading,
  onAsk,
  onFeedback,
  onRestaurantClick
}: AiRecommendationSheetProps) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [feedbackGiven, setFeedbackGiven] = useState<number | null>(null)

  const handleAsk = async () => {
    if (!query.trim()) return
    await onAsk(query)
    setQuery("")
    setFeedbackGiven(null)
  }

  const handleFeedback = async (feedback: number) => {
    setFeedbackGiven(feedback)
    await onFeedback(feedback)
  }

  const handleRestaurantClick = (restaurant: RecommendationRestaurant) => {
    onOpenChange(false)
    if (restaurant.kakaoPlaceId && onRestaurantClick) {
      onRestaurantClick(restaurant.kakaoPlaceId)
    } else {
      router.push(`/search?q=${encodeURIComponent(restaurant.name)}`)
    }
  }

  const quickQueries = ["매운 거", "가성비"]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl px-4">
        <SheetHeader className="pb-3">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" />
            AI 추천
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-[calc(100%-48px)]">
          {/* 질문 입력 */}
          <div className="flex gap-2 pb-3">
            <Input
              placeholder="어떤 음식?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAsk()}
              disabled={isLoading}
              className="h-9 text-sm"
            />
            <Button
              onClick={handleAsk}
              disabled={isLoading || !query.trim()}
              size="sm"
              className="h-9 px-3"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* 빠른 질문 */}
          {!recommendation && !isLoading && (
            <div className="flex gap-2 pb-3">
              {quickQueries.map((q) => (
                <Badge
                  key={q}
                  variant="outline"
                  className="cursor-pointer text-xs py-1"
                  onClick={() => {
                    setQuery(q)
                    onAsk(q)
                  }}
                >
                  {q}
                </Badge>
              ))}
            </div>
          )}

          {/* 결과 영역 */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                추천 중...
              </div>
            ) : recommendation ? (
              <div className="space-y-1">
                {/* 요약 */}
                <p className="text-sm text-muted-foreground pb-2">
                  {recommendation.summary}
                </p>

                {/* 음식점 리스트 */}
                {recommendation.restaurants.length > 0 ? (
                  <div className="divide-y">
                    {recommendation.restaurants.map((restaurant, index) => (
                      <div
                        key={restaurant.id || index}
                        className="py-3 cursor-pointer active:bg-muted/50"
                        onClick={() => handleRestaurantClick(restaurant)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm truncate">
                                {restaurant.name}
                              </span>
                              <span className="text-xs text-muted-foreground shrink-0">
                                {restaurant.categoryDisplay}
                              </span>
                            </div>
                            <p className="text-xs text-primary mt-0.5 line-clamp-1">
                              {restaurant.reason}
                            </p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              {restaurant.rating && restaurant.rating > 0 && (
                                <span className="flex items-center gap-0.5">
                                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                  {restaurant.rating.toFixed(1)}
                                </span>
                              )}
                              <span className="flex items-center gap-0.5 truncate">
                                <MapPin className="h-3 w-3 shrink-0" />
                                {restaurant.address.split(" ").slice(1, 3).join(" ")}
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    추천할 음식점이 없어요
                  </p>
                )}

                {/* 피드백 - 우측 하단 작은 아이콘 */}
                {recommendation.restaurants.length > 0 && feedbackGiven === null && (
                  <div className="flex justify-end gap-1 pt-2">
                    <button
                      onClick={() => handleFeedback(1)}
                      className="p-1.5 rounded hover:bg-muted"
                    >
                      <ThumbsUp className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => handleFeedback(-1)}
                      className="p-1.5 rounded hover:bg-muted"
                    >
                      <ThumbsDown className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                )}
                {feedbackGiven !== null && (
                  <p className="text-xs text-muted-foreground text-right pt-2">
                    감사합니다!
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <p className="text-sm">무엇을 드시고 싶으세요?</p>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
