"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Bell, MapPin, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { MapRegionSelector, RegionSelection } from "@/components/map-region-selector"

interface HomeHeaderProps {
  selectedRegion: RegionSelection
  onRegionChange: (selection: RegionSelection) => void
}

export function HomeHeader({ selectedRegion, onRegionChange }: HomeHeaderProps) {
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [isMapOpen, setIsMapOpen] = useState(false)

  // 선택된 지역 표시 텍스트
  const getRegionDisplayText = () => {
    if (selectedRegion.neighborhood) {
      return `${selectedRegion.district} ${selectedRegion.neighborhood}`
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
    <header className="sticky top-0 z-50 bg-card border-b border-border">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-primary">맛잘알</span>
          <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
            NO 광고
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-foreground"
            onClick={() => setIsMapOpen(true)}
          >
            <MapPin className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium max-w-[120px] truncate">
              {getRegionDisplayText()}
            </span>
            <ChevronDown className="h-3 w-3" />
          </Button>

          <MapRegionSelector
            open={isMapOpen}
            onOpenChange={setIsMapOpen}
            selectedRegion={selectedRegion}
            onRegionChange={onRegionChange}
            userHomeNeighborhood={user?.region}
          />

          <Link href="/notifications">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
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
