"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { Users, Calendar, Clock, Coins, MapPin, MessageCircle, Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { api, GatheringDetailResponse, GatheringParticipantInfo, DepositStatusLabels } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"

interface GatheringDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  gatheringUuid: string
  onJoinSuccess?: () => void
}

export function GatheringDetailDialog({
  open,
  onOpenChange,
  gatheringUuid,
  onJoinSuccess,
}: GatheringDetailDialogProps) {
  const { user } = useAuth()
  const [detail, setDetail] = useState<GatheringDetailResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isJoining, setIsJoining] = useState(false)
  const [isPaying, setIsPaying] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && gatheringUuid) {
      fetchDetail()
    }
  }, [open, gatheringUuid])

  const fetchDetail = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await api.getGathering(gatheringUuid)
      if (result.success) {
        setDetail(result.data)
      } else {
        setError(result.message || "모임 정보를 불러올 수 없습니다")
      }
    } catch (err) {
      console.error("모임 상세 로드 실패:", err)
      setError("모임 정보를 불러올 수 없습니다")
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoin = async () => {
    if (!user) {
      window.location.href = "/login"
      return
    }

    setIsJoining(true)
    setError(null)

    try {
      // 1. 먼저 참여 예약
      const joinResult = await api.joinGathering(gatheringUuid)
      if (!joinResult.success) {
        setError(joinResult.message || "참여 신청에 실패했습니다")
        setIsJoining(false)
        return
      }

      // 2. 아임포트 결제 시작
      setIsPaying(true)
      await initiatePayment()
    } catch (err) {
      console.error("참여 신청 실패:", err)
      setError("참여 신청에 실패했습니다")
      setIsJoining(false)
    }
  }

  const initiatePayment = async () => {
    if (!detail || !user) return

    const gathering = detail.gathering
    const paymentId = `gathering_${gathering.uuid}_${user.id}_${Date.now()}`

    // 포트원 V2 SDK
    const PortOne = (window as unknown as { PortOne: PortOneInstance }).PortOne
    if (!PortOne) {
      setError("결제 모듈을 불러올 수 없습니다")
      setIsPaying(false)
      setIsJoining(false)
      return
    }

    try {
      const response = await PortOne.requestPayment({
        storeId: process.env.NEXT_PUBLIC_PORTONE_STORE_ID || "",
        channelKey: process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY || "",
        paymentId: paymentId,
        orderName: `[맛잘알] ${gathering.title} 보증금`,
        totalAmount: gathering.depositAmount,
        currency: "CURRENCY_KRW",
        payMethod: "CARD",
        customer: {
          fullName: user.name,
          email: user.email || undefined,
        },
      })

      if (response.code) {
        // 결제 실패 또는 취소
        setError(response.message || "결제가 취소되었습니다")
      } else {
        // 결제 성공 - 서버에 검증 요청
        try {
          const verifyResult = await api.verifyGatheringDeposit(
            gatheringUuid,
            response.paymentId,
            paymentId
          )
          if (verifyResult.success) {
            await fetchDetail()
            onJoinSuccess?.()
          } else {
            setError(verifyResult.message || "결제 검증에 실패했습니다")
          }
        } catch (err) {
          console.error("결제 검증 실패:", err)
          setError("결제 검증에 실패했습니다")
        }
      }
    } catch (err) {
      console.error("결제 요청 실패:", err)
      setError("결제 요청에 실패했습니다")
    }

    setIsPaying(false)
    setIsJoining(false)
  }

  const handleCancel = async () => {
    setShowCancelConfirm(false)
    setIsLoading(true)
    try {
      const result = await api.cancelGathering(gatheringUuid)
      if (result.success) {
        await fetchDetail()
        onJoinSuccess?.()
      } else {
        setError(result.message || "모임 취소에 실패했습니다")
      }
    } catch (err) {
      console.error("모임 취소 실패:", err)
      setError("모임 취소에 실패했습니다")
    } finally {
      setIsLoading(false)
    }
  }

  const handleComplete = async () => {
    setShowCompleteConfirm(false)
    setIsLoading(true)
    try {
      const result = await api.completeGathering(gatheringUuid)
      if (result.success) {
        await fetchDetail()
        onJoinSuccess?.()
      } else {
        setError(result.message || "모임 완료 처리에 실패했습니다")
      }
    } catch (err) {
      console.error("모임 완료 실패:", err)
      setError("모임 완료 처리에 실패했습니다")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefund = async (participantId: number) => {
    setIsLoading(true)
    try {
      const result = await api.refundGatheringParticipant(gatheringUuid, participantId)
      if (result.success) {
        await fetchDetail()
      } else {
        setError(result.message || "환금 처리에 실패했습니다")
      }
    } catch (err) {
      console.error("환금 실패:", err)
      setError("환금 처리에 실패했습니다")
    } finally {
      setIsLoading(false)
    }
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

  const getDepositStatusIcon = (status: string) => {
    switch (status) {
      case "DEPOSITED": return <CheckCircle className="w-4 h-4 text-green-500" />
      case "REFUNDED": return <CheckCircle className="w-4 h-4 text-blue-500" />
      case "REFUND_FAILED": return <XCircle className="w-4 h-4 text-red-500" />
      default: return <AlertCircle className="w-4 h-4 text-yellow-500" />
    }
  }

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!detail) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <div className="text-center py-12 text-muted-foreground">
            {error || "모임 정보를 불러올 수 없습니다"}
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const gathering = detail.gathering
  const canJoin = gathering.status === "RECRUITING" &&
    !gathering.isParticipant &&
    gathering.currentParticipants < gathering.maxParticipants &&
    new Date(gathering.targetTime) > new Date()

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <Badge className={`${getStatusColor(gathering.status)} text-white`}>
                {gathering.statusDisplay}
              </Badge>
              {gathering.isHost && (
                <Badge variant="outline">호스트</Badge>
              )}
            </div>
            <DialogTitle>{gathering.title}</DialogTitle>
            {gathering.description && (
              <DialogDescription>{gathering.description}</DialogDescription>
            )}
          </DialogHeader>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* 음식점 정보 */}
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <MapPin className="w-5 h-5 text-primary shrink-0" />
              <div>
                <p className="font-medium">{gathering.restaurant.name}</p>
                <p className="text-sm text-muted-foreground">{gathering.restaurant.address}</p>
              </div>
            </div>

            {/* 모임 정보 */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>{format(new Date(gathering.targetTime), "M월 d일 (EEE)", { locale: ko })}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>{format(new Date(gathering.targetTime), "a h:mm", { locale: ko })}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span>{gathering.currentParticipants}/{gathering.maxParticipants}명</span>
              </div>
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-muted-foreground" />
                <span>보증금 {gathering.depositAmount.toLocaleString()}원</span>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              환금 방식: {gathering.refundTypeDisplay}
            </div>

            <Separator />

            {/* 참여자 목록 */}
            <div>
              <h4 className="font-medium mb-3">참여자 ({detail.participants.length}명)</h4>
              <div className="space-y-2">
                {detail.participants.map((participant: GatheringParticipantInfo) => (
                  <div key={participant.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={participant.userAvatar} />
                        <AvatarFallback>{participant.userName[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium">{participant.userName}</span>
                          {participant.isHost && (
                            <Badge variant="outline" className="text-xs py-0">호스트</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          {getDepositStatusIcon(participant.depositStatus)}
                          <span>{DepositStatusLabels[participant.depositStatus]}</span>
                        </div>
                      </div>
                    </div>
                    {gathering.isHost && !participant.isHost &&
                      (participant.depositStatus === "DEPOSITED" || participant.depositStatus === "REFUND_FAILED") && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRefund(participant.id)}
                        >
                          환금
                        </Button>
                      )}
                  </div>
                ))}
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="flex flex-col gap-2 pt-2">
              {canJoin && (
                <Button
                  onClick={handleJoin}
                  disabled={isJoining || isPaying}
                  className="w-full"
                >
                  {(isJoining || isPaying) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isPaying ? "결제 진행 중..." : `참여하기 (보증금 ${gathering.depositAmount.toLocaleString()}원)`}
                </Button>
              )}

              {gathering.isParticipant && gathering.chatRoomUuid && (
                <Button
                  variant="outline"
                  onClick={() => window.location.href = `/chat?room=${gathering.chatRoomUuid}`}
                  className="w-full"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  채팅방 가기
                </Button>
              )}

              {gathering.isHost && gathering.status === "RECRUITING" && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowCompleteConfirm(true)}
                    className="flex-1"
                  >
                    모임 완료
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setShowCancelConfirm(true)}
                    className="flex-1"
                  >
                    모임 취소
                  </Button>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 모임 취소 확인 */}
      <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>모임을 취소하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              모임을 취소하면 모든 참여자에게 보증금이 환금됩니다.
              이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>아니오</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel}>취소하기</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 모임 완료 확인 */}
      <AlertDialog open={showCompleteConfirm} onOpenChange={setShowCompleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>모임을 완료하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              {gathering.refundType === "AUTO"
                ? "모임이 완료되면 모든 참여자에게 자동으로 보증금이 환금됩니다."
                : "모임이 완료되면 참여자별로 직접 환금해주세요."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>아니오</AlertDialogCancel>
            <AlertDialogAction onClick={handleComplete}>완료하기</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// 포트원 V2 타입 정의
interface PortOneInstance {
  requestPayment: (params: PortOnePaymentParams) => Promise<PortOneResponse>
}

interface PortOnePaymentParams {
  storeId: string
  channelKey: string
  paymentId: string
  orderName: string
  totalAmount: number
  currency: string
  payMethod: string
  customer?: {
    fullName?: string
    email?: string
    phoneNumber?: string
  }
}

interface PortOneResponse {
  paymentId: string
  code?: string
  message?: string
}
