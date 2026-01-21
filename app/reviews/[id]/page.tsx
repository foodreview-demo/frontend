import { ReviewDetailClient } from "./review-detail-client"

// 정적 빌드를 위한 빈 params (런타임에 동적으로 처리)
export function generateStaticParams() {
  return []
}

// 동적 params 허용
export const dynamicParams = true

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ReviewDetailPage({ params }: PageProps) {
  const { id } = await params
  const reviewId = Number(id)

  return <ReviewDetailClient reviewId={reviewId} />
}
