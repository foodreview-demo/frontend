"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Bell, MapPin, ChevronDown, UtensilsCrossed } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { MapRegionSelector, RegionSelection } from "@/components/map-region-selector"
import { categories } from "@/lib/constants"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface HomeHeaderProps {
  selectedRegion: RegionSelection
  onRegionChange: (selection: RegionSelection) => void
  selectedCategory?: string
  onCategoryChange?: (category: string) => void
}

export function HomeHeader({ selectedRegion, onRegionChange, selectedCategory = "전체", onCategoryChange }: HomeHeaderProps) {
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [isMapOpen, setIsMapOpen] = useState(false)

  // 선택된 지역 표시 텍스트
  const getRegionDisplayText = () => {
    if (selectedRegion.neighborhoodLabel) {
      return `${selectedRegion.district} ${selectedRegion.neighborhoodLabel}`
    }
    if (selectedRegion.district) {
      return selectedRegion.district
    }
    if (selectedRegion.region !== "전체") {
      return selectedRegion.region
    }
    return "전체 지역"
  }

  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!user) {
        setUnreadCount(0)
        return
      }
      try {
        const result = await api.getUnreadNotificationCount()
        if (result.success) {
          setUnreadCount(result.data.count)
        }
      } catch (err) {
        console.error("알림 수 로드 실패:", err)
      }
    }

    fetchUnreadCount()
    // 30초마다 갱신
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [user])

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border/50">
      <div className="flex items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-primary">맛잘알</span>
        </div>

        <div className="flex items-center gap-1">
          {/* 지역 선택 */}
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-foreground h-8 px-2"
            onClick={() => setIsMapOpen(true)}
          >
            <MapPin className="h-3.5 w-3.5 text-primary" />
            <span className="text-sm font-medium max-w-[80px] truncate">
              {getRegionDisplayText()}
            </span>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>

          {/* 카테고리 선택 드롭다운 */}
          {onCategoryChange && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1 text-foreground h-8 px-2">
                  <UtensilsCrossed className="h-3.5 w-3.5 text-orange-500" />
                  <span className="text-sm font-medium">{selectedCategory}</span>
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                {categories.map((category) => (
                  <DropdownMenuItem
                    key={category}
                    onClick={() => onCategoryChange(category)}
                    className={selectedCategory === category ? "bg-primary/10 text-primary font-medium" : ""}
                  >
                    {category}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <MapRegionSelector
            open={isMapOpen}
            onOpenChange={setIsMapOpen}
            selectedRegion={selectedRegion}
            onRegionChange={onRegionChange}
            userHomeNeighborhood={user?.region}
          />

          <Link href="/notifications">
            <Button variant="ghost" size="icon" className="relative h-8 w-8">
              <Bell className="h-4.5 w-4.5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
