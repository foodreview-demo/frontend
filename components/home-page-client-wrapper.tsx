// food-review-frontend/components/home-page-client-wrapper.tsx
"use client"

import { useState, Suspense } from "react"
import { HomeHeader } from "@/components/home-header"
import { ReviewFeedClient } from "@/components/review-feed-client"
import { Review } from "@/lib/api"
import { CategoryFilter } from "./category-filter"
import { Loader2 } from "lucide-react"

interface HomePageClientWrapperProps {
  initialReviews: Review[];
  initialRegion?: string;
  initialCategory?: string;
}

export function HomePageClientWrapper({ initialReviews, initialRegion = "전체", initialCategory = "전체" }: HomePageClientWrapperProps) {
  const [selectedRegion, setSelectedRegion] = useState(initialRegion);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);

  return (
    <>
      <HomeHeader selectedRegion={selectedRegion} onRegionChange={setSelectedRegion} />
      <CategoryFilter selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} />
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
