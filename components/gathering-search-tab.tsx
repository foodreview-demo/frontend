"use client"

import { useState } from "react"
import { MapPin, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { RegionSelector } from "@/components/region-selector"
import { GatheringList } from "@/components/gathering-list"
import { useAuth } from "@/lib/auth-context"

export function GatheringSearchTab() {
  const { user } = useAuth()
  const [subTab, setSubTab] = useState<"region" | "my">("region")
  const [selectedRegion, setSelectedRegion] = useState(user?.region || "서울")
  const [selectedDistrict, setSelectedDistrict] = useState(user?.district || "")
  const [selectedNeighborhood, setSelectedNeighborhood] = useState("")

  const handleRegionChange = (region: string, district: string, neighborhood: string) => {
    setSelectedRegion(region)
    setSelectedDistrict(district)
    setSelectedNeighborhood(neighborhood)
  }

  return (
    <div className="flex flex-col h-full">
      {/* 서브탭 */}
      <div className="flex gap-2 px-4 py-3 border-b bg-background sticky top-0 z-10">
        <button
          className={cn(
            "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors",
            subTab === "region"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          )}
          onClick={() => setSubTab("region")}
        >
          <MapPin className="w-4 h-4" />
          내 지역
        </button>
        <button
          className={cn(
            "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors",
            subTab === "my"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          )}
          onClick={() => setSubTab("my")}
        >
          <User className="w-4 h-4" />
          내 모임
        </button>
      </div>

      {/* 지역 필터 (지역 탭일 때만) */}
      {subTab === "region" && (
        <div className="px-4 py-3 border-b bg-muted/30">
          <RegionSelector
            region={selectedRegion}
            district={selectedDistrict}
            neighborhood={selectedNeighborhood}
            onChange={handleRegionChange}
            showNeighborhood={false}
            showAllOption={true}
            size="sm"
          />
        </div>
      )}

      {/* 모임 목록 */}
      <div className="flex-1 overflow-auto px-4 py-4">
        {subTab === "region" ? (
          <GatheringList
            mode="region"
            region={selectedRegion}
            district={selectedDistrict}
          />
        ) : (
          <GatheringList mode="my" />
        )}
      </div>
    </div>
  )
}
