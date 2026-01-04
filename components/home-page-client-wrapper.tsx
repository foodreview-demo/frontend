// food-review-frontend/components/home-page-client-wrapper.tsx
"use client"

import { useState, Suspense } from "react"
import { HomeHeader } from "@/components/home-header"
import { ReviewFeedClient } from "@/components/review-feed-client"
import { Review } from "@/lib/api"
import { Loader2 } from "lucide-react"
import { RegionSelection } from "@/components/map-region-selector"

interface HomePageClientWrapperProps {
  initialReviews: Review[];
  initialCategory?: string;
}

export function HomePageClientWrapper({ initialReviews, initialCategory = "전체" }: HomePageClientWrapperProps) {
  const [selectedRegion, setSelectedRegion] = useState<RegionSelection>({ region: "전체" });
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);

  return (
    <>
      <HomeHeader
        selectedRegion={selectedRegion}
        onRegionChange={setSelectedRegion}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />
      <Suspense fallback={<div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
        <ReviewFeedClient
          initialReviews={initialReviews}
          selectedRegion={selectedRegion}
          selectedCategory={selectedCategory}
        />
      </Suspense>
    </>
  );
}
