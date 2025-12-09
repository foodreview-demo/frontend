import { mockRestaurants } from "@/lib/mock-data"
import { RestaurantClient } from "./restaurant-client"

export function generateStaticParams() {
  return mockRestaurants.map((restaurant) => ({
    id: restaurant.id,
  }))
}

export default async function RestaurantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <RestaurantClient id={id} />
}
