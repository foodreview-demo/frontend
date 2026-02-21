"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Heart, MessageCircle, Star, Sparkles, Users, MoreVertical, Flag, Receipt, ChevronLeft, ChevronRight, Edit2, Trash2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CommentSection } from "@/components/comment-section"
import { ReportModal } from "@/components/report-modal"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { api, type Review } from "@/lib/api"
import { cn } from "@/lib/utils"
import { getTasteLevel, formatDate } from "@/lib/constants"
import { useAuth } from "@/lib/auth-context"

interface ReviewCardProps {
  review: Review
  onDelete?: (reviewId: number) => void
  defaultShowComments?: boolean
  highlightCommentId?: number
}

export function ReviewCard({ review, onDelete, defaultShowComments, highlightCommentId }: ReviewCardProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [sympathyCount, setSympathyCount] = useState(review.sympathyCount)
  const [hasSympathized, setHasSympathized] = useState(review.hasSympathized)
  const [showComments, setShowComments] = useState(defaultShowComments ?? false)
  const [commentCount, setCommentCount] = useState(0)
  const [showReportModal, setShowReportModal] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const tasteLevel = getTasteLevel(review.user.tasteScore)
  const isOwnReview = user?.id === review.user.id

  // 음식 사진만 (영수증 제외)
  const allImages = review.images
  const hasMultipleImages = allImages.length > 1
  const [showReceiptModal, setShowReceiptModal] = useState(false)

  const handleEdit = () => {
    router.push(`/write?editReviewId=${review.id}`)
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const result = await api.deleteReview(review.id)
      if (result.success) {
        setShowDeleteDialog(false)
        onDelete?.(review.id)
      } else {
        alert("리뷰 삭제에 실패했습니다")
      }
    } catch (err) {
      console.error("리뷰 삭제 실패:", err)
      alert("리뷰 삭제에 실패했습니다")
    } finally {
      setIsDeleting(false)
    }
  }

  // 댓글 수 로드
  useEffect(() => {
    const loadCommentCount = async () => {
      try {
        const result = await api.getCommentCount(review.id)
        if (result.success) {
          setCommentCount(result.data)
        }
      } catch (error) {
        // 무시
      }
    }
    loadCommentCount()
  }, [review.id])

  const handleSympathy = async () => {
    try {
      if (hasSympathized) {
        await api.removeSympathy(review.id)
        setSympathyCount((prev) => prev - 1)
      } else {
        await api.addSympathy(review.id)
        setSympathyCount((prev) => prev + 1)
      }
      setHasSympathized(!hasSympathized)
    } catch (err) {
      console.error("공감 처리 실패:", err)
    }
  }

  return (
    <Card className="overflow-hidden rounded-3xl border-2 border-[#FFE5CC] shadow-[0_4px_16px_rgba(255,107,107,0.15)] bg-card transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_12px_32px_rgba(255,107,107,0.25)] hover:border-[#FF6B6B]">
      {/* User Header */}
      <div className="p-5 flex items-center gap-3 bg-gradient-to-br from-[#FFF5E9] to-white">
        <Link href={`/profile/${review.user.id}`}>
          <Avatar className="h-12 w-12 ring-3 ring-gradient-to-br ring-offset-2 from-[#FF6B6B] to-[#4ECDC4] shadow-[0_4px_12px_rgba(255,107,107,0.2)]">
            <AvatarImage src={review.user.avatar || "/placeholder.svg"} alt={review.user.name} />
            <AvatarFallback>{review.user.name[0]}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Link href={`/profile/${review.user.id}`} className="font-black text-base text-foreground hover:underline">
              {review.user.name}
            </Link>
            <Badge variant="secondary" className={cn("text-xs font-black bg-gradient-to-br from-[#FFD93D] to-[#FFA500] text-white shadow-[0_2px_8px_rgba(255,165,0,0.3)]", tasteLevel.color)}>
              {tasteLevel.label}
            </Badge>
          </div>
          <p className="text-xs text-[#8B7355] font-medium">
            {review.user.region} · 맛잘알 점수 {review.user.tasteScore.toLocaleString()}
          </p>
        </div>
        {/* 영수증 인증 배지 - 검증 상태에 따라 다르게 표시 */}
        {review.receiptImageUrl && (
          <button onClick={() => setShowReceiptModal(true)}>
            {review.isReceiptVerified ? (
              <Badge variant="outline" className="gap-1 text-xs border-green-500 text-green-600 hover:bg-green-50 cursor-pointer">
                <Receipt className="h-3 w-3" />
                인증됨
              </Badge>
            ) : review.receiptVerificationStatus === 'PENDING' || review.receiptVerificationStatus === 'PENDING_REVIEW' ? (
              <Badge variant="outline" className="gap-1 text-xs border-yellow-500 text-yellow-600 hover:bg-yellow-50 cursor-pointer">
                <Receipt className="h-3 w-3" />
                검토 중
              </Badge>
            ) : review.receiptVerificationStatus === 'REJECTED' || review.receiptVerificationStatus === 'MANUALLY_REJECTED' ? (
              <Badge variant="outline" className="gap-1 text-xs border-gray-400 text-gray-500 hover:bg-gray-50 cursor-pointer">
                <Receipt className="h-3 w-3" />
                첨부됨
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1 text-xs border-gray-400 text-gray-500 hover:bg-gray-50 cursor-pointer">
                <Receipt className="h-3 w-3" />
                첨부됨
              </Badge>
            )}
          </button>
        )}
        {review.isFirstReview && (
          <Badge className="bg-primary text-primary-foreground gap-1">
            <Sparkles className="h-3 w-3" />첫 리뷰
          </Badge>
        )}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isOwnReview ? (
                <>
                  <DropdownMenuItem onClick={handleEdit}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    수정하기
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    삭제하기
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem onClick={() => setShowReportModal(true)} className="text-destructive">
                  <Flag className="h-4 w-4 mr-2" />
                  신고하기
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Restaurant Info */}
      {/* Restaurant Info */}
      <Link href={`/restaurant?id=${review.restaurant.uuid}`}>
        <div className="mx-5 mb-4 p-4 bg-white rounded-2xl border-2 border-[#FFE5CC] transition-all hover:border-[#4ECDC4] hover:bg-gradient-to-br hover:from-[rgba(78,205,196,0.05)] hover:to-white hover:translate-x-1 shadow-sm hover:shadow-md flex items-center justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-black text-lg text-foreground">{review.restaurant.name}</h3>
              <Badge variant="outline" className="text-xs border-[#FFE5CC]">
                {review.restaurant.categoryDisplay || review.restaurant.category}
              </Badge>
            </div>
            <p className="text-sm text-[#8B7355] font-medium">{review.restaurant.address}</p>
          </div>
          <div className="text-2xl text-[#4ECDC4] transition-transform group-hover:translate-x-1">→</div>
        </div>
      </Link>

      {/* Review Images */}
      {allImages.length > 0 && (
        <div className="relative aspect-[4/3] bg-muted">
          <Image
            src={allImages[currentImageIndex] || "/placeholder.svg"}
            alt={`${review.restaurant.name} 리뷰 이미지`}
            fill
            className="object-cover"
          />
          {/* 이미지 네비게이션 */}
          {hasMultipleImages && (
            <>
              <button
                onClick={() => setCurrentImageIndex(prev => prev > 0 ? prev - 1 : allImages.length - 1)}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => setCurrentImageIndex(prev => prev < allImages.length - 1 ? prev + 1 : 0)}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              {/* 인디케이터 */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                {allImages.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      idx === currentImageIndex ? "w-4 bg-white" : "w-1.5 bg-white/50"
                    )}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Review Content */}
      <div className="p-4">
        {/* Rating & Menu */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn("h-4 w-4", i < review.rating ? "fill-primary text-primary" : "fill-muted text-muted")}
              />
            ))}
          </div>
          <span className="text-sm font-medium text-foreground">{review.menu}</span>
          <span className="text-sm text-muted-foreground">{review.price}</span>
        </div>

        {/* Detail Ratings */}
        {(review.tasteRating || review.priceRating || review.atmosphereRating || review.serviceRating) && (
          <div className="grid grid-cols-4 gap-3 p-4 bg-gradient-to-br from-[#FFF5E9] to-white rounded-2xl mb-4 border-2 border-[#FFE5CC]">
            {review.tasteRating && (
              <div className="text-center">
                <div className="text-xs text-[#8B7355] mb-1.5 font-semibold">맛</div>
                <div className="text-2xl font-black bg-gradient-to-br from-[#FF6B6B] to-[#FF8E53] bg-clip-text text-transparent">{review.tasteRating}</div>
              </div>
            )}
            {review.priceRating && (
              <div className="text-center">
                <div className="text-xs text-[#8B7355] mb-1.5 font-semibold">가격</div>
                <div className="text-2xl font-black bg-gradient-to-br from-[#FF6B6B] to-[#FF8E53] bg-clip-text text-transparent">{review.priceRating}</div>
              </div>
            )}
            {review.atmosphereRating && (
              <div className="text-center">
                <div className="text-xs text-[#8B7355] mb-1.5 font-semibold">분위기</div>
                <div className="text-2xl font-black bg-gradient-to-br from-[#FF6B6B] to-[#FF8E53] bg-clip-text text-transparent">{review.atmosphereRating}</div>
              </div>
            )}
            {review.serviceRating && (
              <div className="text-center">
                <div className="text-xs text-[#8B7355] mb-1.5 font-semibold">친절</div>
                <div className="text-2xl font-black bg-gradient-to-br from-[#FF6B6B] to-[#FF8E53] bg-clip-text text-transparent">{review.serviceRating}</div>
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <p className="text-foreground leading-relaxed mb-3">{review.content}</p>

        {/* Reference Info - 나중에 필요할 수 있어서 주석 처리 */}
        {/* {review.referenceInfo && (
          <Link href={`/profile/${review.referenceInfo.user.id}`}>
            <div className="flex items-center gap-2 mb-3 p-2 bg-secondary/50 rounded-lg">
              <Avatar className="h-5 w-5">
                <AvatarImage src={review.referenceInfo.user.avatar} />
                <AvatarFallback className="text-xs">{review.referenceInfo.user.name[0]}</AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{review.referenceInfo.user.name}</span>님의 리뷰를 참고했어요
              </span>
            </div>
          </Link>
        )} */}

        {/* Reference Count Badge */}
        {/* Reference Count Badge */}
        {review.referenceCount !== undefined && review.referenceCount > 0 && (
          <div className="bg-gradient-to-br from-[rgba(167,139,250,0.1)] to-[rgba(139,92,246,0.05)] border-l-4 border-[#A78BFA] p-4 rounded-2xl mb-4 shadow-[0_2px_12px_rgba(167,139,250,0.15)]">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-[#A78BFA]" />
              <span className="text-sm font-black text-[#A78BFA]">💡 이 리뷰를 참고한 사람들</span>
            </div>
            <div className="text-sm text-[#5D4E37] font-semibold">
              <strong className="text-foreground">{review.referenceCount}명</strong>이 참고했어요
            </div>
          </div>
        )}

        {/* Actions */}
        {/* Actions */}
        <div className="flex items-center gap-3 pt-3 border-t-2 border-[#FFE5CC]">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "flex-1 gap-2 py-3 rounded-xl border-2 font-bold transition-all hover:-translate-y-0.5 hover:shadow-md",
              hasSympathized 
                ? "bg-gradient-to-br from-[rgba(255,107,107,0.15)] to-[rgba(255,142,83,0.1)] border-[#FF6B6B] text-[#FF6B6B]" 
                : "bg-white border-[#FFE5CC] text-[#8B7355] hover:bg-[#FFF5E9]"
            )}
            onClick={handleSympathy}
          >
            <Heart className={cn("h-5 w-5", hasSympathized && "fill-[#FF6B6B]")} />
            <span className="font-bold">{sympathyCount}</span>
            <span className="text-sm">공감</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "flex-1 gap-2 py-3 rounded-xl border-2 font-bold transition-all hover:-translate-y-0.5 hover:shadow-md",
              showComments
                ? "bg-gradient-to-br from-[rgba(255,107,107,0.15)] to-[rgba(255,142,83,0.1)] border-[#FF6B6B] text-[#FF6B6B]"
                : "bg-white border-[#FFE5CC] text-[#8B7355] hover:bg-[#FFF5E9]"
            )}
            onClick={() => setShowComments(!showComments)}
          >
            <MessageCircle className={cn("h-5 w-5", showComments && "fill-[#FF6B6B]")} />
            {commentCount > 0 && <span className="font-bold">{commentCount}</span>}
            <span className="text-sm">댓글</span>
          </Button>
        </div>

        {/* Date */}
        <p className="text-xs text-muted-foreground mt-3">
          방문일 {review.visitDate} · 작성일 {formatDate(review.createdAt)}
        </p>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-border">
          <CommentSection
            reviewId={review.id}
            reviewUserId={review.user.id}
            highlightCommentId={highlightCommentId}
          />
        </div>
      )}

      {/* Report Modal */}
      <ReportModal
        open={showReportModal}
        onOpenChange={setShowReportModal}
        reviewId={review.id}
      />

      {/* Receipt Modal */}
      <Dialog open={showReceiptModal} onOpenChange={setShowReceiptModal}>
        <DialogContent className="max-w-sm mx-auto p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-2">
            <DialogTitle className="flex items-center gap-2 text-base">
              <Receipt className="h-4 w-4" />
              영수증
            </DialogTitle>
          </DialogHeader>
          {review.receiptImageUrl && (
            <div className="relative aspect-[3/4] w-full">
              <Image
                src={review.receiptImageUrl}
                alt="영수증"
                fill
                className="object-contain bg-muted"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>리뷰 삭제</DialogTitle>
            <DialogDescription>
              이 리뷰를 삭제하시겠습니까? 삭제된 리뷰는 복구할 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "삭제 중..." : "삭제"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
