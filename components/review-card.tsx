"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Heart, MessageCircle, Star, Sparkles, Users, MoreVertical, Flag, Receipt, ChevronLeft, ChevronRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CommentSection } from "@/components/comment-section"
import { ReportModal } from "@/components/report-modal"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { api, type Review } from "@/lib/api"
import { cn } from "@/lib/utils"
import { getTasteLevel, formatDate } from "@/lib/constants"
import { useAuth } from "@/lib/auth-context"

interface ReviewCardProps {
  review: Review
}

export function ReviewCard({ review }: ReviewCardProps) {
  const { user } = useAuth()
  const [sympathyCount, setSympathyCount] = useState(review.sympathyCount)
  const [hasSympathized, setHasSympathized] = useState(review.hasSympathized)
  const [showComments, setShowComments] = useState(false)
  const [commentCount, setCommentCount] = useState(0)
  const [showReportModal, setShowReportModal] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const tasteLevel = getTasteLevel(review.user.tasteScore)
  const isOwnReview = user?.id === review.user.id

  // 음식 사진만 (영수증 제외)
  const allImages = review.images
  const hasMultipleImages = allImages.length > 1
  const [showReceiptModal, setShowReceiptModal] = useState(false)

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
    <Card className="overflow-hidden border-0 shadow-sm bg-card">
      {/* User Header */}
      <div className="p-4 flex items-center gap-3">
        <Link href={`/profile/${review.user.id}`}>
          <Avatar className="h-10 w-10 ring-2 ring-primary/20">
            <AvatarImage src={review.user.avatar || "/placeholder.svg"} alt={review.user.name} />
            <AvatarFallback>{review.user.name[0]}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Link href={`/profile/${review.user.id}`} className="font-semibold text-foreground hover:underline">
              {review.user.name}
            </Link>
            <Badge variant="secondary" className={cn("text-xs", tasteLevel.color)}>
              {tasteLevel.label}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {review.user.region} · 맛잘알 점수 {review.user.tasteScore.toLocaleString()}
          </p>
        </div>
        {/* 영수증 인증 배지 - 클릭 시 영수증 모달 */}
        {review.receiptImageUrl && (
          <button onClick={() => setShowReceiptModal(true)}>
            <Badge variant="outline" className="gap-1 text-xs border-green-500 text-green-600 hover:bg-green-50 cursor-pointer">
              <Receipt className="h-3 w-3" />
              인증됨
            </Badge>
          </button>
        )}
        {review.isFirstReview && (
          <Badge className="bg-primary text-primary-foreground gap-1">
            <Sparkles className="h-3 w-3" />첫 리뷰
          </Badge>
        )}
        {user && !isOwnReview && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowReportModal(true)} className="text-destructive">
                <Flag className="h-4 w-4 mr-2" />
                신고하기
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Restaurant Info */}
      <Link href={`/restaurant/${review.restaurant.id}`}>
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg text-foreground">{review.restaurant.name}</h3>
            <Badge variant="outline" className="text-xs">
              {review.restaurant.category}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{review.restaurant.address}</p>
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
          <div className="flex flex-wrap gap-3 mb-3 text-xs text-muted-foreground">
            {review.tasteRating && (
              <span className="flex items-center gap-1">
                <span>맛</span>
                <Star className="h-3 w-3 fill-primary text-primary" />
                <span className="font-medium text-foreground">{review.tasteRating}</span>
              </span>
            )}
            {review.priceRating && (
              <span className="flex items-center gap-1">
                <span>가격</span>
                <Star className="h-3 w-3 fill-primary text-primary" />
                <span className="font-medium text-foreground">{review.priceRating}</span>
              </span>
            )}
            {review.atmosphereRating && (
              <span className="flex items-center gap-1">
                <span>분위기</span>
                <Star className="h-3 w-3 fill-primary text-primary" />
                <span className="font-medium text-foreground">{review.atmosphereRating}</span>
              </span>
            )}
            {review.serviceRating && (
              <span className="flex items-center gap-1">
                <span>친절</span>
                <Star className="h-3 w-3 fill-primary text-primary" />
                <span className="font-medium text-foreground">{review.serviceRating}</span>
              </span>
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
        {review.referenceCount !== undefined && review.referenceCount > 0 && (
          <div className="flex items-center gap-1 mb-3 text-xs text-muted-foreground">
            <Users className="h-3 w-3" />
            <span>{review.referenceCount}명이 이 리뷰를 참고했어요</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className={cn("gap-2 px-0 hover:bg-transparent", hasSympathized ? "text-primary" : "text-muted-foreground")}
            onClick={handleSympathy}
          >
            <Heart className={cn("h-5 w-5", hasSympathized && "fill-primary")} />
            <span className="font-semibold">{sympathyCount}</span>
            <span className="text-sm">공감</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "gap-2 px-0 hover:bg-transparent hover:text-foreground",
              showComments ? "text-primary" : "text-muted-foreground"
            )}
            onClick={() => setShowComments(!showComments)}
          >
            <MessageCircle className={cn("h-5 w-5", showComments && "fill-primary")} />
            {commentCount > 0 && <span className="font-semibold">{commentCount}</span>}
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
          <CommentSection reviewId={review.id} reviewUserId={review.user.id} />
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
    </Card>
  )
}
