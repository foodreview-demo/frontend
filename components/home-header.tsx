"use client"

import { useState } from "react"
import { Bell, MapPin, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { regions } from "@/lib/mock-data"

interface HomeHeaderProps {
  selectedRegion: string
  onRegionChange: (region: string) => void
}

export function HomeHeader({ selectedRegion, onRegionChange }: HomeHeaderProps) {
  const [hasNotification] = useState(true)

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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1 text-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{selectedRegion === "전체" ? "전체 지역" : selectedRegion}</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {regions.map((region) => (
                <DropdownMenuItem
                  key={region}
                  onClick={() => onRegionChange(region)}
                  className={selectedRegion === region ? "bg-primary/10 text-primary" : ""}
                >
                  {region}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {hasNotification && <span className="absolute top-1 right-1 h-2 w-2 bg-destructive rounded-full" />}
          </Button>
        </div>
      </div>
    </header>
  )
}
