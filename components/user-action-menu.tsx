'use client'

import { useState } from 'react'
import { MoreVertical, UserX, Flag, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { api } from '@/lib/api'

interface UserActionMenuProps {
  userId: number
  userName: string
  onBlock?: () => void
}

export function UserActionMenu({ userId, userName, onBlock }: UserActionMenuProps) {
  const [showBlockDialog, setShowBlockDialog] = useState(false)
  const [isBlocking, setIsBlocking] = useState(false)

  const handleBlock = async () => {
    setIsBlocking(true)
    try {
      await api.blockUser(userId)
      setShowBlockDialog(false)
      onBlock?.()
    } catch (error) {
      console.error('Failed to block user:', error)
      alert('차단에 실패했습니다')
    } finally {
      setIsBlocking(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => setShowBlockDialog(true)}
          >
            <UserX className="mr-2 h-4 w-4" />
            차단하기
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              사용자 차단
            </DialogTitle>
            <DialogDescription asChild>
              <div>
                <strong>{userName}</strong>님을 차단하시겠습니까?
                <br /><br />
                차단하면:
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>이 사용자의 리뷰가 피드에 표시되지 않습니다</li>
                  <li>이 사용자의 채팅 메시지를 받을 수 없습니다</li>
                  <li>서로 팔로우 관계가 해제됩니다</li>
                </ul>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBlockDialog(false)}>
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleBlock}
              disabled={isBlocking}
            >
              {isBlocking ? '차단 중...' : '차단하기'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
