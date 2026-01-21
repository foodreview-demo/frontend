import { Suspense } from "react"
import { RestaurantClient } from "./restaurant-client"
import { Loader2 } from "lucide-react"

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}

export default function RestaurantDetailPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <RestaurantClient />
    </Suspense>
  )
}
