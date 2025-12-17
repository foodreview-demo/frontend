// food-review-frontend/components/home-page-client-wrapper.tsx
"use client"

import { useState } from "react"
import { HomeHeader } from "@/components/home-header"
import { ReviewFeedClient } from "@/components/review-feed-client"
import { Review } from "@/lib/api"
import { CategoryFilter } from "./category-filter"

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
      <ReviewFeedClient
        initialReviews={initialReviews}
        selectedRegion={selectedRegion}
        selectedCategory={selectedCategory}
      />
    </>
  );
}
