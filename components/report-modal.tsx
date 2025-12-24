'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { api, REPORT_REASONS, ReportReason } from '@/lib/api'
import { AlertTriangle, CheckCircle } from 'lucide-react'

interface ReportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  reviewId: number
}

export function ReportModal({ open, onOpenChange, reviewId }: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null)
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!selectedReason) return

    setIsSubmitting(true)
    setError(null)

    try {
      await api.createReport({
        reviewId,
        reason: selectedReason,
        description: description.trim() || undefined,
      })
      setIsSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : '신고 접수에 실패했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setSelectedReason(null)
    setDescription('')
    setIsSuccess(false)
    setError(null)
    onOpenChange(false)
  }

  if (isSuccess) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold">신고가 접수되었습니다</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                관리자가 검토 후 적절한 조치를 취하겠습니다.
              </p>
            </div>
            <Button onClick={handleClose} className="mt-2">
              확인
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            리뷰 신고
          </DialogTitle>
          <DialogDescription>
            부적절한 리뷰를 신고해주세요. 신고 사유를 선택해주세요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">신고 사유</label>
            <div className="grid grid-cols-2 gap-2">
              {REPORT_REASONS.map((reason) => (
                <button
                  key={reason.value}
                  type="button"
                  onClick={() => setSelectedReason(reason.value)}
                  className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                    selectedReason === reason.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  {reason.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              상세 설명 <span className="text-muted-foreground">(선택)</span>
            </label>
            <Textarea
              placeholder="신고 사유를 자세히 설명해주세요"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedReason || isSubmitting}
            variant="destructive"
          >
            {isSubmitting ? '신고 중...' : '신고하기'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
