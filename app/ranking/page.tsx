"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Trophy, Medal, Crown, ChevronDown, TrendingUp, Calendar, Loader2 } from "lucide-react"
import { MobileLayout } from "@/components/mobile-layout"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api, RankingUser } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "@/lib/i18n-context"
import { cn } from "@/lib/utils"
import { regions, getTasteLevel } from "@/lib/constants"

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="h-10 w-10 rounded-full bg-yellow-400 flex items-center justify-center">
        <Crown className="h-5 w-5 text-yellow-900" />
      </div>
    )
  }
  if (rank === 2) {
    return (
      <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
        <Medal className="h-5 w-5 text-gray-700" />
      </div>
    )
  }
  if (rank === 3) {
    return (
      <div className="h-10 w-10 rounded-full bg-amber-600 flex items-center justify-center">
        <Medal className="h-5 w-5 text-amber-100" />
      </div>
    )
  }
  return (
    <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
      <span className="font-bold text-secondary-foreground">{rank}</span>
    </div>
  )
}

export default function RankingPage() {
  const { user: currentUser } = useAuth()
  const t = useTranslation()
  const [selectedRegion, setSelectedRegion] = useState("전체")
  const [period, setPeriod] = useState<"monthly" | "weekly">("monthly")
  const [users, setUsers] = useState<RankingUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRanking = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const result = await api.getRanking(
          selectedRegion !== "전체" ? selectedRegion : undefined
        )
        if (result.success) {
          setUsers(result.data.content)
        }
      } catch (err) {
        console.error("랭킹 로드 실패:", err)
        setError(t.common.error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRanking()
  }, [selectedRegion, t.common.error])

  const currentUserRank = currentUser ? users.findIndex((u) => u.id === currentUser.id) + 1 : 0

  return (
    <MobileLayout>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold text-foreground">{t.ranking.title}</h1>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1 bg-transparent">
                  {selectedRegion === "전체" ? t.regions.all : selectedRegion}
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {regions.map((region) => (
                  <DropdownMenuItem
                    key={region}
                    onClick={() => setSelectedRegion(region)}
                    className={selectedRegion === region ? "bg-primary/10 text-primary" : ""}
                  >
                    {region}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Tabs value={period} onValueChange={(v) => setPeriod(v as "monthly" | "weekly")}>
            <TabsList className="grid w-full grid-cols-2 bg-secondary">
              <TabsTrigger value="monthly" className="gap-1">
                <Calendar className="h-4 w-4" />
                {t.ranking.monthly}
              </TabsTrigger>
              <TabsTrigger value="weekly" className="gap-1">
                <TrendingUp className="h-4 w-4" />
                {t.ranking.weekly}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{error}</p>
          </div>
        ) : (
          <>
            {/* My Ranking Card */}
            {currentUser && currentUserRank > 0 && (
              <Card className="p-4 bg-primary/5 border-primary/20">
                <div className="flex items-center gap-3">
                  <RankBadge rank={currentUserRank} />
                  <Avatar className="h-12 w-12 ring-2 ring-primary/30">
                    <AvatarImage src={currentUser.avatar || "/placeholder.svg"} alt={currentUser.name} />
                    <AvatarFallback>{currentUser.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">{currentUser.name}</span>
                      <Badge className="text-xs bg-primary text-primary-foreground">{t.profile.me || "Me"}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{currentUser.tasteScore.toLocaleString()}{t.ranking.points}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">{t.ranking.rank || "Rank"}</p>
                    <p className="text-xl font-bold text-primary">#{currentUserRank}</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Top 3 Podium */}
            {users.length >= 3 && (
              <div className="flex items-end justify-center gap-2 py-4">
                {/* 2nd Place */}
                <div className="flex flex-col items-center">
                  <Link href={`/profile/${users[1].id}`}>
                    <Avatar className="h-16 w-16 ring-4 ring-gray-300 mb-2">
                      <AvatarImage src={users[1].avatar || "/placeholder.svg"} alt={users[1].name} />
                      <AvatarFallback>{users[1].name[0]}</AvatarFallback>
                    </Avatar>
                  </Link>
                  <Medal className="h-6 w-6 text-gray-400 mb-1" />
                  <p className="text-sm font-semibold text-foreground text-center truncate w-20">{users[1].name}</p>
                  <p className="text-xs text-muted-foreground">{users[1].tasteScore.toLocaleString()}{t.ranking.points}</p>
                  <div className="h-16 w-20 bg-gray-200 rounded-t-lg mt-2" />
                </div>

                {/* 1st Place */}
                <div className="flex flex-col items-center -mt-6">
                  <Link href={`/profile/${users[0].id}`}>
                    <Avatar className="h-20 w-20 ring-4 ring-yellow-400 mb-2">
                      <AvatarImage src={users[0].avatar || "/placeholder.svg"} alt={users[0].name} />
                      <AvatarFallback>{users[0].name[0]}</AvatarFallback>
                    </Avatar>
                  </Link>
                  <Crown className="h-8 w-8 text-yellow-500 mb-1" />
                  <p className="text-sm font-bold text-foreground text-center truncate w-20">{users[0].name}</p>
                  <p className="text-xs text-muted-foreground">{users[0].tasteScore.toLocaleString()}{t.ranking.points}</p>
                  <div className="h-24 w-20 bg-yellow-100 rounded-t-lg mt-2" />
                </div>

                {/* 3rd Place */}
                <div className="flex flex-col items-center">
                  <Link href={`/profile/${users[2].id}`}>
                    <Avatar className="h-16 w-16 ring-4 ring-amber-600 mb-2">
                      <AvatarImage src={users[2].avatar || "/placeholder.svg"} alt={users[2].name} />
                      <AvatarFallback>{users[2].name[0]}</AvatarFallback>
                    </Avatar>
                  </Link>
                  <Medal className="h-6 w-6 text-amber-600 mb-1" />
                  <p className="text-sm font-semibold text-foreground text-center truncate w-20">{users[2].name}</p>
                  <p className="text-xs text-muted-foreground">{users[2].tasteScore.toLocaleString()}{t.ranking.points}</p>
                  <div className="h-12 w-20 bg-amber-100 rounded-t-lg mt-2" />
                </div>
              </div>
            )}

            {/* Full Ranking List */}
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">{t.ranking.allTime}</h3>
              {users.map((user) => {
                const level = getTasteLevel(user.tasteScore)
                const isCurrentUser = currentUser && user.id === currentUser.id

                return (
                  <Link key={user.id} href={`/profile/${user.id}`}>
                    <Card
                      className={cn(
                        "p-3 flex items-center gap-3 transition-colors border",
                        isCurrentUser ? "bg-primary/5 border-primary/30" : "hover:bg-secondary/50 border-border",
                      )}
                    >
                      <RankBadge rank={user.rank} />
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                        <AvatarFallback>{user.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground truncate">{user.name}</span>
                          {isCurrentUser && <Badge className="text-xs bg-primary text-primary-foreground">{t.profile.me || "Me"}</Badge>}
                          <Badge variant="secondary" className={cn("text-xs", level.color)}>
                            {level.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{user.region}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-foreground">{user.tasteScore.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{t.profile.reviews} {user.reviewCount}</p>
                      </div>
                    </Card>
                  </Link>
                )
              })}
            </div>

            {users.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">{t.restaurant.noResults}</p>
              </div>
            )}
          </>
        )}
      </div>
    </MobileLayout>
  )
}
