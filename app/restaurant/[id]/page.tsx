import { RestaurantClient } from "./restaurant-client"

export function generateStaticParams() {
  // Static export에서는 모든 가능한 경로를 미리 생성해야 함
  // 1~100까지 ID 생성
  return Array.from({ length: 100 }, (_, i) => ({ id: String(i + 1) }))
}

export default async function RestaurantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <RestaurantClient id={id} />
}
