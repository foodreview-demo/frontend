"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Lock, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth-context"
import { api, Badge, BadgeCategory } from "@/lib/api"
import { formatRelativeTime } from "@/lib/constants"

export default function BadgesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [badges, setBadges] = useState<Badge[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"all" | BadgeCategory>("all")

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }
    loadBadges()
  }, [user])

  const loadBadges = async () => {
    try {
      const response = await api.getBadges()
      if (response.success) {
        setBadges(response.data)
      }
    } catch (error) {
      console.error("Failed to load badges:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleDisplay = async (badge: Badge) => {
    if (!badge.acquired) return

    try {
      const newDisplayState = !badge.isDisplayed
      await api.toggleBadgeDisplay(badge.id, newDisplayState)

      setBadges(prev =>
        prev.map(b =>
          b.id === badge.id ? { ...b, isDisplayed: newDisplayState } : b
        )
      )
    } catch (error) {
      console.error("Failed to toggle badge display:", error)
    }
  }

  const filteredBadges = activeTab === "all"
    ? badges
    : badges.filter(b => b.category === activeTab)

  const gradeBadges = badges.filter(b => b.category === "GRADE")
  const achievementBadges = badges.filter(b => b.category === "ACHIEVEMENT")

  const acquiredCount = badges.filter(b => b.acquired).length
  const totalCount = badges.length

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b z-10">
        <div className="flex items-center h-14 px-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-lg font-semibold ml-2">배지</h1>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Summary */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">획득한 배지</p>
              <p className="text-2xl font-bold">
                {acquiredCount} <span className="text-muted-foreground text-base font-normal">/ {totalCount}</span>
              </p>
            </div>
            <div className="flex gap-1">
              {badges.filter(b => b.acquired).slice(0, 5).map(badge => (
                <span key={badge.id} className="text-2xl">{badge.icon}</span>
              ))}
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">전체</TabsTrigger>
            <TabsTrigger value="GRADE">등급</TabsTrigger>
            <TabsTrigger value="ACHIEVEMENT">도전과제</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4 space-y-6">
            {/* Grade Badges */}
            <div>
              <h2 className="text-sm font-medium text-muted-foreground mb-3">등급 배지</h2>
              <div className="grid grid-cols-2 gap-3">
                {gradeBadges.map(badge => (
                  <BadgeCard
                    key={badge.id}
                    badge={badge}
                    onToggleDisplay={() => handleToggleDisplay(badge)}
                  />
                ))}
              </div>
            </div>

            {/* Achievement Badges */}
            <div>
              <h2 className="text-sm font-medium text-muted-foreground mb-3">도전과제 배지</h2>
              <div className="grid grid-cols-2 gap-3">
                {achievementBadges.map(badge => (
                  <BadgeCard
                    key={badge.id}
                    badge={badge}
                    onToggleDisplay={() => handleToggleDisplay(badge)}
                  />
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="GRADE" className="mt-4">
            <div className="grid grid-cols-2 gap-3">
              {gradeBadges.map(badge => (
                <BadgeCard
                  key={badge.id}
                  badge={badge}
                  onToggleDisplay={() => handleToggleDisplay(badge)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="ACHIEVEMENT" className="mt-4">
            <div className="grid grid-cols-2 gap-3">
              {achievementBadges.map(badge => (
                <BadgeCard
                  key={badge.id}
                  badge={badge}
                  onToggleDisplay={() => handleToggleDisplay(badge)}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function BadgeCard({ badge, onToggleDisplay }: { badge: Badge; onToggleDisplay: () => void }) {
  return (
    <Card
      className={`p-4 relative ${badge.acquired ? "bg-card" : "bg-muted/50 opacity-60"}`}
      onClick={onToggleDisplay}
    >
      {/* Display indicator */}
      {badge.acquired && badge.isDisplayed && (
        <div className="absolute top-2 right-2">
          <Check className="h-4 w-4 text-primary" />
        </div>
      )}

      <div className="flex flex-col items-center text-center">
        <div className={`text-4xl mb-2 ${!badge.acquired && "grayscale"}`}>
          {badge.icon}
        </div>
        <h3 className="font-medium text-sm">{badge.name}</h3>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
          {badge.description}
        </p>

        {badge.acquired ? (
          <p className="text-xs text-primary mt-2">
            {badge.acquiredAt && formatRelativeTime(badge.acquiredAt)} 획득
          </p>
        ) : (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
            <Lock className="h-3 w-3" />
            <span>미획득</span>
          </div>
        )}
      </div>
    </Card>
  )
}
