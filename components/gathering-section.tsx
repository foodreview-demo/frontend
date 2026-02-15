"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { Users, Calendar, Clock, Coins, Plus, MessageCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { GatheringCreateDialog } from "@/components/gathering-create-dialog"
import { GatheringDetailDialog } from "@/components/gathering-detail-dialog"
import { api, GatheringResponse, Restaurant } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"

interface GatheringSectionProps {
  restaurant: Restaurant
}

export function GatheringSection({ restaurant }: GatheringSectionProps) {
  const { user } = useAuth()
  const [gatherings, setGatherings] = useState<GatheringResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedGathering, setSelectedGathering] = useState<GatheringResponse | null>(null)

  const fetchGatherings = async () => {
    try {
      const result = await api.getGatheringsByRestaurant(restaurant.id)
      if (result.success) {
        setGatherings(result.data)
      }
    } catch (error) {
      console.error("모임 목록 로드 실패:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchGatherings()
  }, [restaurant.id])

  const handleCreateSuccess = (newGathering: GatheringResponse) => {
    setGatherings(prev => [newGathering, ...prev])
    setShowCreateDialog(false)
  }

  const handleJoinSuccess = () => {
    fetchGatherings()
    setSelectedGathering(null)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "RECRUITING":
        return "bg-green-500"
      case "CONFIRMED":
        return "bg-blue-500"
      case "IN_PROGRESS":
        return "bg-yellow-500"
      case "COMPLETED":
        return "bg-gray-500"
      case "CANCELLED":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 모임 만들기 버튼 */}
      {user && (
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="w-full"
          variant="outline"
        >
          <Plus className="w-4 h-4 mr-2" />
          번개모임 만들기
        </Button>
      )}

      {/* 모임 목록 */}
      {gatherings.length > 0 ? (
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
        </div>
      ) : (
        <div className="text-center py-8 bg-card rounded-xl border border-border">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold text-foreground mb-2">아직 모임이 없어요</h3>
          <p className="text-muted-foreground text-sm mb-4">
            이 음식점에서 첫 번개모임을 만들어보세요!
          </p>
          {user && (
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              모임 만들기
            </Button>
          )}
        </div>
      )}

      {/* 모임 생성 다이얼로그 */}
      <GatheringCreateDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        restaurant={restaurant}
        onSuccess={handleCreateSuccess}
      />

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
