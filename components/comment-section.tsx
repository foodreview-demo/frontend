"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { MessageCircle, Send, MoreHorizontal, ChevronDown, ChevronUp, Loader2, Trash2, Edit2, X, CornerDownRight } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { api, Comment } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"

interface CommentSectionProps {
  reviewId: number
  reviewUserId: number // 리뷰 작성자 ID (삭제 권한용)
  highlightCommentId?: number // 하이라이트할 댓글 ID (푸시 알림 클릭 시)
}

export function CommentSection({ reviewId, reviewUserId, highlightCommentId }: CommentSectionProps) {
  const { user, isAuthenticated } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newComment, setNewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [replyTo, setReplyTo] = useState<Comment | null>(null)
  const [editingComment, setEditingComment] = useState<Comment | null>(null)
  const [editContent, setEditContent] = useState("")
  const [expandedReplies, setExpandedReplies] = useState<Set<number>>(new Set())
  const [replies, setReplies] = useState<Record<number, Comment[]>>({})
  const [loadingReplies, setLoadingReplies] = useState<Set<number>>(new Set())
  const [highlightedId, setHighlightedId] = useState<number | undefined>(highlightCommentId)
  const commentRefs = useRef<Record<number, HTMLDivElement | null>>({})

  // 댓글 목록 로드
  const loadComments = useCallback(async () => {
    try {
      const result = await api.getComments(reviewId, 0, 100)
      if (result.success) {
        setComments(result.data.content)
      }
    } catch (error) {
      console.error("댓글 로드 실패:", error)
    } finally {
      setIsLoading(false)
    }
  }, [reviewId])

  useEffect(() => {
    loadComments()
  }, [loadComments])

  // 하이라이트할 댓글로 스크롤
  useEffect(() => {
    if (!highlightCommentId || isLoading) return

    const scrollToComment = async () => {
      // 먼저 최상위 댓글에서 찾기
      const topLevelComment = comments.find(c => c.id === highlightCommentId)

      if (topLevelComment) {
        // 최상위 댓글인 경우 바로 스크롤
        setTimeout(() => {
          const element = commentRefs.current[highlightCommentId]
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" })
          }
        }, 100)
        return
      }

      // 대댓글인 경우: 모든 부모 댓글의 대댓글을 로드해서 찾기
      for (const comment of comments) {
        if (comment.replyCount > 0) {
          // 대댓글 로드
          try {
            const result = await api.getReplies(comment.id, 0, 100)
            if (result.success) {
              const foundReply = result.data.content.find((r: Comment) => r.id === highlightCommentId)
              if (foundReply) {
                // 해당 부모 댓글의 대댓글 섹션 펼치기
                setReplies(prev => ({ ...prev, [comment.id]: result.data.content }))
                setExpandedReplies(prev => new Set([...prev, comment.id]))

                // 스크롤
                setTimeout(() => {
                  const element = commentRefs.current[highlightCommentId]
                  if (element) {
                    element.scrollIntoView({ behavior: "smooth", block: "center" })
                  }
                }, 200)
                return
              }
            }
          } catch (error) {
            console.error("대댓글 로드 실패:", error)
          }
        }
      }
    }

    scrollToComment()
  }, [highlightCommentId, isLoading, comments])

  // 하이라이트 효과 제거 (3초 후)
  useEffect(() => {
    if (highlightedId) {
      const timer = setTimeout(() => {
        setHighlightedId(undefined)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [highlightedId])

  // 대댓글 로드
  const loadReplies = async (commentId: number) => {
    if (loadingReplies.has(commentId)) return

    setLoadingReplies(prev => new Set([...prev, commentId]))
    try {
      const result = await api.getReplies(commentId, 0, 100)
      if (result.success) {
        setReplies(prev => ({ ...prev, [commentId]: result.data.content }))
        setExpandedReplies(prev => new Set([...prev, commentId]))
      }
    } catch (error) {
      console.error("대댓글 로드 실패:", error)
    } finally {
      setLoadingReplies(prev => {
        const next = new Set(prev)
        next.delete(commentId)
        return next
      })
    }
  }

  // 대댓글 토글
  const toggleReplies = (commentId: number) => {
    if (expandedReplies.has(commentId)) {
      setExpandedReplies(prev => {
        const next = new Set(prev)
        next.delete(commentId)
        return next
      })
    } else {
      loadReplies(commentId)
    }
  }

  // 댓글 작성
  const handleSubmit = async () => {
    if (!newComment.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const result = await api.createComment(reviewId, {
        content: newComment,
        parentId: replyTo?.id,
      })

      if (result.success) {
        if (replyTo) {
          // 대댓글인 경우 해당 댓글의 replies에 추가
          setReplies(prev => ({
            ...prev,
            [replyTo.id]: [...(prev[replyTo.id] || []), result.data],
          }))
          // 대댓글 수 업데이트
          setComments(prev =>
            prev.map(c =>
              c.id === replyTo.id ? { ...c, replyCount: c.replyCount + 1 } : c
            )
          )
          // 대댓글 섹션 확장
          setExpandedReplies(prev => new Set([...prev, replyTo.id]))
        } else {
          // 일반 댓글인 경우 목록에 추가
          setComments(prev => [...prev, result.data])
        }
        setNewComment("")
        setReplyTo(null)
      }
    } catch (error) {
      console.error("댓글 작성 실패:", error)
      alert("댓글 작성에 실패했습니다")
    } finally {
      setIsSubmitting(false)
    }
  }

  // 댓글 수정
  const handleUpdate = async () => {
    if (!editingComment || !editContent.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const result = await api.updateComment(editingComment.id, editContent)

      if (result.success) {
        if (editingComment.parentId) {
          // 대댓글 수정
          setReplies(prev => ({
            ...prev,
            [editingComment.parentId!]: prev[editingComment.parentId!]?.map(r =>
              r.id === editingComment.id ? result.data : r
            ) || [],
          }))
        } else {
          // 일반 댓글 수정
          setComments(prev =>
            prev.map(c => (c.id === editingComment.id ? result.data : c))
          )
        }
        setEditingComment(null)
        setEditContent("")
      }
    } catch (error) {
      console.error("댓글 수정 실패:", error)
      alert("댓글 수정에 실패했습니다")
    } finally {
      setIsSubmitting(false)
    }
  }

  // 댓글 삭제
  const handleDelete = async (comment: Comment) => {
    if (!confirm("댓글을 삭제하시겠습니까?")) return

    try {
      const result = await api.deleteComment(comment.id)

      if (result.success) {
        if (comment.parentId) {
          // 대댓글 삭제
          setReplies(prev => ({
            ...prev,
            [comment.parentId!]: prev[comment.parentId!]?.filter(r => r.id !== comment.id) || [],
          }))
          // 대댓글 수 업데이트
          setComments(prev =>
            prev.map(c =>
              c.id === comment.parentId ? { ...c, replyCount: c.replyCount - 1 } : c
            )
          )
        } else {
          // 일반 댓글 삭제
          setComments(prev => prev.filter(c => c.id !== comment.id))
        }
      }
    } catch (error) {
      console.error("댓글 삭제 실패:", error)
      alert("댓글 삭제에 실패했습니다")
    }
  }

  // 시간 포맷
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMinutes < 1) return "방금 전"
    if (diffMinutes < 60) return `${diffMinutes}분 전`
    if (diffHours < 24) return `${diffHours}시간 전`
    if (diffDays < 7) return `${diffDays}일 전`
    return date.toLocaleDateString("ko-KR")
  }

  // 댓글 아이템 렌더링
  const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => {
    const canDelete = !comment.isDeleted && (comment.isMine || user?.id === reviewUserId)
    const canEdit = !comment.isDeleted && comment.isMine

    if (editingComment?.id === comment.id) {
      return (
        <div className={cn("py-3", isReply && "pl-8")}>
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="min-h-[60px] text-sm resize-none"
            placeholder="댓글을 수정하세요"
          />
          <div className="flex justify-end gap-2 mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditingComment(null)
                setEditContent("")
              }}
            >
              취소
            </Button>
            <Button
              size="sm"
              onClick={handleUpdate}
              disabled={!editContent.trim() || isSubmitting}
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "수정"}
            </Button>
          </div>
        </div>
      )
    }

    const isHighlighted = highlightedId === comment.id

    return (
      <div
        ref={(el) => { commentRefs.current[comment.id] = el }}
        className={cn(
          "py-3 transition-colors duration-500 rounded-lg -mx-2 px-2",
          isReply && "pl-8",
          isHighlighted && "bg-primary/10 animate-pulse"
        )}
      >
        <div className="flex gap-3">
          {isReply && (
            <CornerDownRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
          )}
          <Link href={`/profile/${comment.user.id}`}>
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage src={comment.user.avatar || "/placeholder.svg"} alt={comment.user.name} />
              <AvatarFallback>{comment.user.name[0]}</AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Link href={`/profile/${comment.user.id}`} className="font-medium text-sm hover:underline">
                {comment.user.name}
              </Link>
              <span className="text-xs text-muted-foreground">{formatTime(comment.createdAt)}</span>
              {comment.createdAt !== comment.updatedAt && (
                <span className="text-xs text-muted-foreground">(수정됨)</span>
              )}
            </div>
            <p className={cn(
              "text-sm mt-1 whitespace-pre-wrap break-words",
              comment.isDeleted ? "text-muted-foreground italic" : "text-foreground"
            )}>
              {comment.content}
            </p>
            <div className="flex items-center gap-3 mt-2">
              {isAuthenticated && !isReply && !comment.isDeleted && (
                <button
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => {
                    setReplyTo(comment)
                    setNewComment("")
                  }}
                >
                  답글
                </button>
              )}
              {!isReply && comment.replyCount > 0 && (
                <button
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                  onClick={() => toggleReplies(comment.id)}
                >
                  {expandedReplies.has(comment.id) ? (
                    <>
                      <ChevronUp className="h-3 w-3" />
                      답글 숨기기
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3" />
                      답글 {comment.replyCount}개
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
          {(canEdit || canDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canEdit && (
                  <DropdownMenuItem
                    onClick={() => {
                      setEditingComment(comment)
                      setEditContent(comment.content)
                    }}
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    수정
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => handleDelete(comment)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    삭제
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* 대댓글 목록 */}
        {!isReply && expandedReplies.has(comment.id) && (
          <div className="mt-2 border-l-2 border-border ml-4">
            {loadingReplies.has(comment.id) ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              replies[comment.id]?.map((reply) => (
                <CommentItem key={reply.id} comment={reply} isReply />
              ))
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-card rounded-xl border border-border">
      {/* 헤더 */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <MessageCircle className="h-5 w-5 text-muted-foreground" />
        <span className="font-medium">댓글</span>
        <span className="text-muted-foreground">({comments.length})</span>
      </div>

      {/* 댓글 목록 */}
      <div className="divide-y divide-border px-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : comments.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <MessageCircle className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>첫 번째 댓글을 남겨보세요!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))
        )}
      </div>

      {/* 댓글 입력 */}
      {isAuthenticated ? (
        <div className="p-4 border-t border-border">
          {replyTo && (
            <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
              <CornerDownRight className="h-4 w-4" />
              <span>{replyTo.user.name}님에게 답글 작성 중</span>
              <button
                className="ml-auto hover:text-foreground"
                onClick={() => setReplyTo(null)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.name} />
              <AvatarFallback>{user?.name?.[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 flex gap-2">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={replyTo ? "답글을 입력하세요..." : "댓글을 입력하세요..."}
                className="min-h-[40px] max-h-[120px] text-sm resize-none"
                rows={1}
              />
              <Button
                size="icon"
                onClick={handleSubmit}
                disabled={!newComment.trim() || isSubmitting}
                className="flex-shrink-0"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 border-t border-border text-center">
          <Link href="/login" className="text-primary hover:underline text-sm">
            로그인하고 댓글을 남겨보세요
          </Link>
        </div>
      )}
    </div>
  )
}
