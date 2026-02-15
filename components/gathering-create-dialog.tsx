"use client"

import { useState } from "react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { CalendarIcon, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { api, Restaurant, GatheringResponse, RefundType } from "@/lib/api"
import { cn } from "@/lib/utils"

interface GatheringCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  restaurant: Restaurant
  onSuccess: (gathering: GatheringResponse) => void
}

export function GatheringCreateDialog({
  open,
  onOpenChange,
  restaurant,
  onSuccess,
}: GatheringCreateDialogProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [time, setTime] = useState("18:00")
  const [maxParticipants, setMaxParticipants] = useState("4")
  const [depositAmount, setDepositAmount] = useState("5000")
  const [refundType, setRefundType] = useState<RefundType>("AUTO")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("모임 제목을 입력해주세요")
      return
    }
    if (!date) {
      setError("날짜를 선택해주세요")
      return
    }

    const [hours, minutes] = time.split(":").map(Number)
    const targetTime = new Date(date)
    targetTime.setHours(hours, minutes, 0, 0)

    if (targetTime <= new Date()) {
      setError("미래 시간을 선택해주세요")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const result = await api.createGathering({
        restaurantId: restaurant.id,
        title: title.trim(),
        description: description.trim() || undefined,
        targetTime: targetTime.toISOString(),
        maxParticipants: parseInt(maxParticipants),
        depositAmount: parseInt(depositAmount),
        refundType,
      })

      if (result.success) {
        onSuccess(result.data)
        resetForm()
      } else {
        setError(result.message || "모임 생성에 실패했습니다")
      }
    } catch (err) {
      console.error("모임 생성 실패:", err)
      setError("모임 생성에 실패했습니다")
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setTitle("")
    setDescription("")
    setDate(undefined)
    setTime("18:00")
    setMaxParticipants("4")
    setDepositAmount("5000")
    setRefundType("AUTO")
    setError(null)
  }

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetForm()
      onOpenChange(open)
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>번개모임 만들기</DialogTitle>
          <DialogDescription>
            {restaurant.name}에서 함께할 사람들을 모집해보세요
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="title">모임 제목 *</Label>
            <Input
              id="title"
              placeholder="예: 오늘 저녁 삼겹살 드실 분!"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">설명</Label>
            <Textarea
              id="description"
              placeholder="모임에 대한 추가 설명을 적어주세요"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>날짜 *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "M월 d일", { locale: ko }) : "날짜 선택"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    locale={ko}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="time">시간 *</Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="maxParticipants">최대 인원</Label>
              <Select value={maxParticipants} onValueChange={setMaxParticipants}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2, 3, 4, 5, 6, 7, 8, 10].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}명
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="depositAmount">보증금</Label>
              <Select value={depositAmount} onValueChange={setDepositAmount}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1000, 2000, 3000, 5000, 10000, 20000].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n.toLocaleString()}원
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>환금 방식</Label>
            <Select value={refundType} onValueChange={(v) => setRefundType(v as RefundType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AUTO">자동 환금 (모임 완료 시 자동 환금)</SelectItem>
                <SelectItem value="MANUAL">수동 환금 (호스트가 직접 환금)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            모임 만들기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
