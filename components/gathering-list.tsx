"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { Users, Calendar, Clock, Coins, MessageCircle, Loader2, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { GatheringDetailDialog } from "@/components/gathering-detail-dialog"
import { api, GatheringResponse } from "@/lib/api"

interface GatheringListProps {
  mode: "region" | "my"
  region?: string
  district?: string
  onRefresh?: () => void
}

export function GatheringList({ mode, region, district, onRefresh }: GatheringListProps) {
  const [gatherings, setGatherings] = useState<GatheringResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [selectedGathering, setSelectedGathering] = useState<GatheringResponse | null>(null)

  const fetchGatherings = async (pageNum: number, append = false) => {
    if (pageNum === 0) {
      setIsLoading(true)
    } else {
      setIsLoadingMore(true)
    }

    try {
      let result
      if (mode === "region" && region) {
        result = await api.getGatheringsByRegion(region, district, pageNum, 20)
      } else if (mode === "my") {
        // 내가 만든 모임 + 내가 참여한 모임 병합
        const [created, joined] = await Promise.all([
          api.getMyCreatedGatherings(0, 100),
          api.getMyJoinedGatherings(0, 100),
        ])

        // 병합 및 중복 제거
        const allGatherings: GatheringResponse[] = []
        const seen = new Set<number>()

        if (created.success && created.data?.content) {
          for (const g of created.data.content) {
            if (!seen.has(g.id)) {
              seen.add(g.id)
              allGatherings.push(g)
            }
          }
        }
        if (joined.success && joined.data?.content) {
          for (const g of joined.data.content) {
            if (!seen.has(g.id)) {
              seen.add(g.id)
              allGatherings.push(g)
            }
          }
        }

        // 최신순 정렬
        allGatherings.sort((a, b) =>
          new Date(b.targetTime).getTime() - new Date(a.targetTime).getTime()
        )

        setGatherings(allGatherings)
        setHasMore(false)
        setIsLoading(false)
        setIsLoadingMore(false)
        return
      }

      if (result?.success && result.data) {
        const newGatherings = result.data.content || []
        if (append) {
          setGatherings(prev => [...prev, ...newGatherings])
        } else {
          setGatherings(newGatherings)
        }
        setHasMore(!result.data.last)
      }
    } catch (error) {
      console.error("모임 목록 로드 실패:", error)
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }

  useEffect(() => {
    setPage(0)
    setGatherings([])
    fetchGatherings(0)
  }, [mode, region, district])

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchGatherings(nextPage, true)
  }

  const handleJoinSuccess = () => {
    fetchGatherings(0)
    setSelectedGathering(null)
    onRefresh?.()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "RECRUITING": return "bg-green-500"
      case "CONFIRMED": return "bg-blue-500"
      case "IN_PROGRESS": return "bg-yellow-500"
      case "COMPLETED": return "bg-gray-500"
      case "CANCELLED": return "bg-red-500"
      default: return "bg-gray-500"
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (gatherings.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="font-semibold text-foreground mb-2">
          {mode === "region" ? "이 지역에 모임이 없어요" : "참여 중인 모임이 없어요"}
        </h3>
        <p className="text-muted-foreground text-sm">
          {mode === "region"
            ? "다른 지역을 선택하거나 음식점에서 모임을 만들어보세요"
            : "음식점 상세 페이지에서 번개모임에 참여해보세요"}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {gatherings.map((gathering) => (
        <Card
          key={gathering.id}
          className="cursor-pointer hover:bg-accent/50 transition-colors"
          onClick={() => setSelectedGathering(gathering)}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={`${getStatusColor(gathering.status)} text-white text-xs`}>
                    {gathering.statusDisplay}
                  </Badge>
                  {gathering.isHost && (
                    <Badge variant="outline" className="text-xs">호스트</Badge>
                  )}
                  {gathering.isParticipant && !gathering.isHost && (
                    <Badge variant="secondary" className="text-xs">참여중</Badge>
                  )}
                </div>
                <h3 className="font-semibold text-foreground">{gathering.title}</h3>
              </div>
            </div>

            {/* 음식점 정보 (지역 모드에서 표시) */}
            {mode === "region" && gathering.restaurant && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <MapPin className="w-4 h-4" />
                <span className="truncate">{gathering.restaurant.name}</span>
              </div>
            )}

            <div className="space-y-1.5 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>
                  {format(new Date(gathering.targetTime), "M월 d일 (EEE)", { locale: ko })}
                </span>
                <Clock className="w-4 h-4 ml-2" />
                <span>
                  {format(new Date(gathering.targetTime), "a h:mm", { locale: ko })}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>{gathering.currentParticipants}/{gathering.maxParticipants}명</span>
                </div>
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4" />
                  <span>보증금 {gathering.depositAmount.toLocaleString()}원</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t">
              <div className="flex items-center gap-2">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={gathering.creator.avatar} />
                  <AvatarFallback>{gathering.creator.name[0]}</AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground">{gathering.creator.name}</span>
              </div>
              {gathering.chatRoomUuid && gathering.isParticipant && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8"
                  onClick={(e) => {
                    e.stopPropagation()
                    window.location.href = `/chat?room=${gathering.chatRoomUuid}`
                  }}
                >
                  <MessageCircle className="w-4 h-4 mr-1" />
                  채팅
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* 더보기 버튼 */}
      {hasMore && (
        <Button
          variant="outline"
          className="w-full"
          onClick={handleLoadMore}
          disabled={isLoadingMore}
        >
          {isLoadingMore ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : null}
          더보기
        </Button>
      )}

      {/* 모임 상세 다이얼로그 */}
      {selectedGathering && (
        <GatheringDetailDialog
          open={!!selectedGathering}
          onOpenChange={(open) => !open && setSelectedGathering(null)}
          gatheringUuid={selectedGathering.uuid}
          onJoinSuccess={handleJoinSuccess}
        />
      )}
    </div>
  )
}
