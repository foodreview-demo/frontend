"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Bell, MapPin, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { regions } from "@/lib/constants"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"

interface HomeHeaderProps {
  selectedRegion: string
  onRegionChange: (region: string) => void
}

export function HomeHeader({ selectedRegion, onRegionChange }: HomeHeaderProps) {
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!user) {
        setUnreadCount(0)
        return
      }
      try {
        const result = await api.getChatRooms()
        if (result.success) {
          const total = result.data.content.reduce((sum: number, room: any) => sum + room.unreadCount, 0)
          setUnreadCount(total)
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
