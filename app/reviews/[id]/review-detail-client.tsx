"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { ReviewCard } from "@/components/review-card"
import { api, type Review } from "@/lib/api"

interface ReviewDetailClientProps {
  reviewId: number
}

export function ReviewDetailClient({ reviewId }: ReviewDetailClientProps) {
  const searchParams = useSearchParams()
  const commentId = searchParams.get("commentId")
    ? Number(searchParams.get("commentId"))
    : undefined

  const [review, setReview] = useState<Review | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadReview = async () => {
      try {
        const result = await api.getReview(reviewId)
        if (result.success) {
          setReview(result.data)
        } else {
          setError("리뷰를 찾을 수 없습니다")
        }
      } catch (err) {
        console.error("리뷰 로드 실패:", err)
        setError("리뷰를 불러오는데 실패했습니다")
      } finally {
        setIsLoading(false)
      }
    }

    if (reviewId) {
      loadReview()
    }
  }, [reviewId])

  const handleDelete = () => {
    window.location.href = "/"
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !review) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-background border-b border-border">
          <div className="flex items-center gap-3 px-4 h-14">
            <Link href="/" className="p-2 -ml-2 hover:bg-accent rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="font-semibold">리뷰</h1>
          </div>
        </header>
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-muted-foreground">{error || "리뷰를 찾을 수 없습니다"}</p>
          <Link href="/" className="mt-4 text-primary hover:underline">
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="flex items-center gap-3 px-4 h-14">
          <Link href="/" className="p-2 -ml-2 hover:bg-accent rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="font-semibold">리뷰</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto">
        <ReviewCard
          review={review}
          onDelete={handleDelete}
          defaultShowComments={!!commentId}
          highlightCommentId={commentId}
        />
      </div>
    </div>
  )
}
