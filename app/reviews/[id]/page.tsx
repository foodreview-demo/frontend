import { ReviewDetailClient } from "./review-detail-client"

export function generateStaticParams() {
  // Static export에서는 모든 가능한 경로를 미리 생성해야 함
  // 1~1000까지 ID 생성 (리뷰는 프로필보다 많을 수 있으므로 범위 확대)
  return Array.from({ length: 1000 }, (_, i) => ({ id: String(i + 1) }))
}

export default async function ReviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ReviewDetailClient reviewId={Number(id)} />
}
