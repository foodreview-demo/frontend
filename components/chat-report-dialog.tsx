'use client'

import { useState } from 'react'
import { Flag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { api, ChatReportReason } from '@/lib/api'

const CHAT_REPORT_REASONS: { value: ChatReportReason; label: string }[] = [
  { value: 'HARASSMENT', label: '욕설/비방' },
  { value: 'SPAM', label: '스팸/광고' },
  { value: 'SEXUAL_HARASSMENT', label: '성희롱' },
  { value: 'FRAUD', label: '사기/피싱' },
  { value: 'INAPPROPRIATE', label: '부적절한 내용' },
  { value: 'OTHER', label: '기타' },
]

interface ChatReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  reportedUserId: number
  reportedUserName: string
  chatRoomId: number
  messageId?: number
  messageContent?: string
  onSuccess?: () => void
}

export function ChatReportDialog({
  open,
  onOpenChange,
  reportedUserId,
  reportedUserName,
  chatRoomId,
  messageId,
  messageContent,
  onSuccess,
}: ChatReportDialogProps) {
  const [reason, setReason] = useState<ChatReportReason>('HARASSMENT')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      await api.createChatReport({
        reportedUserId,
        chatRoomId,
        messageId,
        messageContent,
        reason,
        description: description || undefined,
      })
      onOpenChange(false)
      onSuccess?.()
      alert('신고가 접수되었습니다')
      // Reset form
      setReason('HARASSMENT')
      setDescription('')
    } catch (error) {
      console.error('Failed to report:', error)
      alert('신고 접수에 실패했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-destructive" />
            사용자 신고
          </DialogTitle>
          <DialogDescription>
            <strong>{reportedUserName}</strong>님을 신고합니다.
            {messageContent && (
              <div className="mt-2 p-2 bg-muted rounded text-sm">
                &ldquo;{messageContent.length > 100 ? messageContent.slice(0, 100) + '...' : messageContent}&rdquo;
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>신고 사유</Label>
            <RadioGroup value={reason} onValueChange={(v) => setReason(v as ChatReportReason)}>
              {CHAT_REPORT_REASONS.map((r) => (
                <div key={r.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={r.value} id={r.value} />
                  <Label htmlFor={r.value} className="font-normal cursor-pointer">
                    {r.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">상세 설명 (선택)</Label>
            <Textarea
              id="description"
              placeholder="추가 설명이 있다면 입력해주세요"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? '신고 중...' : '신고하기'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
