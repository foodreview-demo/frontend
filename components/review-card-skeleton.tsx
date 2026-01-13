// components/review-card-skeleton.tsx
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function ReviewCardSkeleton() {
  return (
    <Card className="overflow-hidden border-0 shadow-sm bg-card">
      {/* User Header */}
      <div className="p-4 flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
          <Skeleton className="h-3 w-32" />
        </div>
      </div>

      {/* Restaurant Info */}
      <div className="px-4 pb-3 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
        <Skeleton className="h-4 w-48" />
      </div>

      {/* Image */}
      <Skeleton className="aspect-[4/3] w-full rounded-none" />

      {/* Review Content */}
      <div className="p-4 space-y-3">
        {/* Rating & Menu */}
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-4 w-4 rounded" />
            ))}
          </div>
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>

        {/* Content */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-14" />
        </div>

        {/* Date */}
        <Skeleton className="h-3 w-40" />
      </div>
    </Card>
  )
}

interface ReviewFeedSkeletonProps {
  count?: number
}

export function ReviewFeedSkeleton({ count = 3 }: ReviewFeedSkeletonProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <ReviewCardSkeleton key={i} />
      ))}
    </div>
  )
}
