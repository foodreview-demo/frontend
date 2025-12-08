"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Search, Star, MapPin, Sparkles } from "lucide-react"
import { MobileLayout } from "@/components/mobile-layout"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { mockRestaurants, categories } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("전체")

  const filteredRestaurants = mockRestaurants.filter((restaurant) => {
    const matchesQuery =
      !searchQuery || restaurant.name.includes(searchQuery) || restaurant.address.includes(searchQuery)
    const matchesCategory = selectedCategory === "전체" || restaurant.category === selectedCategory
    return matchesQuery && matchesCategory
  })

  // Sort to show restaurants without reviews first
  const sortedRestaurants = [...filteredRestaurants].sort((a, b) => {
    if (a.reviewCount === 0 && b.reviewCount > 0) return -1
    if (a.reviewCount > 0 && b.reviewCount === 0) return 1
    return b.averageRating - a.averageRating
  })

  return (
    <MobileLayout>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border px-4 py-3">
        <h1 className="text-xl font-bold text-foreground mb-3">맛집 검색</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="음식점 이름, 지역, 메뉴 검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </header>

      {/* Category Filter */}
      <div className="px-4 py-3 flex gap-2 overflow-x-auto bg-card border-b border-border">
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "secondary"}
            size="sm"
            className={cn(
              "rounded-full whitespace-nowrap flex-shrink-0",
              selectedCategory === category
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground",
            )}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </Button>
        ))}
      </div>

      {/* First Review Banner */}
      <div className="px-4 py-3">
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-primary flex-shrink-0" />
          <p className="text-sm text-foreground">
            <span className="font-semibold">첫 리뷰 작성하면 점수 2배!</span> 아래 음식점에서 첫 리뷰어가 되어보세요
          </p>
        </div>
      </div>

      {/* Restaurant List */}
      <div className="p-4 space-y-3">
        {sortedRestaurants.map((restaurant) => (
          <Link key={restaurant.id} href={`/restaurant/${restaurant.id}`}>
            <Card className="p-3 flex gap-3 hover:bg-secondary/50 transition-colors border border-border">
              <div className="relative h-24 w-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                <Image
                  src={restaurant.thumbnail || "/placeholder.svg"}
                  alt={restaurant.name}
                  fill
                  className="object-cover"
                />
                {restaurant.reviewCount === 0 && (
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-foreground truncate">{restaurant.name}</h3>
                  <Badge variant="outline" className="text-xs flex-shrink-0">
                    {restaurant.category}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 text-sm mb-1">
                  {restaurant.reviewCount > 0 ? (
                    <>
                      <Star className="h-4 w-4 fill-primary text-primary" />
                      <span className="font-medium text-foreground">{restaurant.averageRating}</span>
                      <span className="text-muted-foreground">({restaurant.reviewCount})</span>
                    </>
                  ) : (
                    <Badge className="bg-primary text-primary-foreground text-xs gap-1">
                      <Sparkles className="h-3 w-3" />첫 리뷰 대기 중
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{restaurant.address}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{restaurant.priceRange}</p>
              </div>
            </Card>
          </Link>
        ))}

        {sortedRestaurants.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">검색 결과가 없습니다</p>
          </div>
        )}
      </div>
    </MobileLayout>
  )
}
