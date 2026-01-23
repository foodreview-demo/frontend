"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Settings, MapPin, Edit2, Loader2, ListMusic, Users, Award, Check, Lock } from "lucide-react"
import { MobileLayout } from "@/components/mobile-layout"
import { TasteScoreCard } from "@/components/taste-score-card"
import { ScoreHistory } from "@/components/score-history"
import { ReviewCard } from "@/components/review-card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge as BadgeUI } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "@/lib/i18n-context"
import { api, Review, User, InfluenceStats, Badge } from "@/lib/api"

export default function ProfilePage() {
  const { user: currentUser } = useAuth()
  const t = useTranslation()
  const [activeTab, setActiveTab] = useState("reviews")
  const [reviews, setReviews] = useState<Review[]>([])
  const [followingCount, setFollowingCount] = useState(0)
  const [influenceStats, setInfluenceStats] = useState<InfluenceStats | null>(null)
  const [myBadges, setMyBadges] = useState<Badge[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [badgeSheetOpen, setBadgeSheetOpen] = useState(false)

  const displayedBadges = myBadges.filter(b => b.isDisplayed)
  const acquiredBadges = myBadges.filter(b => b.acquired)

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return
      setIsLoading(true)
      try {
        const [reviewsResult, followingsResult, influenceResult, badgesResult] = await Promise.all([
          api.getUserReviews(currentUser.id),
          api.getFollowings(currentUser.id),
          api.getInfluenceStats(currentUser.id),
          api.getBadges(),
        ])

        if (reviewsResult.success) {
          setReviews(reviewsResult.data.content)
        }
        if (followingsResult.success) {
          setFollowingCount(followingsResult.data.totalElements)
        }
        if (influenceResult.success) {
          setInfluenceStats(influenceResult.data)
        }
        if (badgesResult.success) {
          setMyBadges(badgesResult.data)
        }
      } catch (err) {
        console.error("프로필 데이터 로드 실패:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [currentUser])

  const handleToggleBadgeDisplay = async (badge: Badge) => {
    if (!badge.acquired) return

    try {
      const newDisplayState = !badge.isDisplayed
      await api.toggleBadgeDisplay(badge.id, newDisplayState)
      setMyBadges(prev =>
        prev.map(b =>
          b.id === badge.id ? { ...b, isDisplayed: newDisplayState } : b
        )
      )
    } catch (error) {
      console.error("배지 표시 토글 실패:", error)
    }
  }

  if (!currentUser) {
    return (
      <MobileLayout>
        <div className="flex justify-center items-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MobileLayout>
    )
  }

  return (
    <MobileLayout>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold text-foreground">{t.profile.myInfo}</h1>
          <Link href="/settings">
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Profile Header */}
        <Card className="p-4 border border-border">
          <div className="flex items-start gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20 ring-4 ring-primary/20">
                <AvatarImage src={currentUser.avatar || "/placeholder.svg"} alt={currentUser.name} />
                <AvatarFallback>{currentUser.name[0]}</AvatarFallback>
              </Avatar>
              <button className="absolute bottom-0 right-0 h-7 w-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                <Edit2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="text-xl font-bold text-foreground">{currentUser.name}</h2>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span>{currentUser.region}</span>
                  </div>
                </div>
                {/* Badge Display Area */}
                <Sheet open={badgeSheetOpen} onOpenChange={setBadgeSheetOpen}>
                  <SheetTrigger asChild>
                    <button className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-secondary/50 transition-colors">
                      {displayedBadges.length > 0 ? (
                        <div className="flex gap-0.5">
                          {displayedBadges.slice(0, 3).map(badge => (
                            <span key={badge.id} className="text-xl">{badge.icon}</span>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Award className="h-4 w-4" />
                          <span>배지</span>
                        </div>
                      )}
                    </button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="h-[70vh]">
                    <SheetHeader>
                      <SheetTitle className="flex items-center justify-between">
                        <span>배지</span>
                        <span className="text-sm font-normal text-muted-foreground">
                          획득 {acquiredBadges.length}개 / 전체 {myBadges.length}개
                        </span>
                      </SheetTitle>
                    </SheetHeader>
                    <div className="mt-4 space-y-6 overflow-y-auto max-h-[calc(70vh-80px)] pb-4">
                      {/* 등급 배지 */}
                      {myBadges.filter(b => b.category === 'GRADE').length > 0 && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-3">등급 배지</h3>
                          <div className="grid grid-cols-3 gap-3">
                            {myBadges.filter(b => b.category === 'GRADE').map(badge => (
                              <button
                                key={badge.id}
                                onClick={() => badge.acquired && handleToggleBadgeDisplay(badge)}
                                disabled={!badge.acquired}
                                className={`p-3 rounded-xl border-2 transition-all relative ${
                                  !badge.acquired
                                    ? "border-border bg-muted/30 opacity-50"
                                    : badge.isDisplayed
                                      ? "border-primary bg-primary/10"
                                      : "border-border hover:border-primary/50"
                                }`}
                              >
                                {badge.acquired && badge.isDisplayed && (
                                  <div className="absolute top-1 right-1">
                                    <Check className="h-3 w-3 text-primary" />
                                  </div>
                                )}
                                <div className="flex flex-col items-center text-center">
                                  <span className={`text-2xl mb-1 ${!badge.acquired && "grayscale"}`}>
                                    {badge.icon}
                                  </span>
                                  <span className="text-xs font-medium truncate w-full">{badge.name}</span>
                                  {!badge.acquired && (
                                    <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground mt-1">
                                      <Lock className="h-2.5 w-2.5" />
                                      <span>{badge.conditionValue}점</span>
                                    </div>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 도전과제 배지 */}
                      {myBadges.filter(b => b.category === 'ACHIEVEMENT').length > 0 && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-3">도전과제 배지</h3>
                          <div className="grid grid-cols-2 gap-3">
                            {myBadges.filter(b => b.category === 'ACHIEVEMENT').map(badge => (
                              <button
                                key={badge.id}
                                onClick={() => badge.acquired && handleToggleBadgeDisplay(badge)}
                                disabled={!badge.acquired}
                                className={`p-3 rounded-xl border-2 transition-all relative ${
                                  !badge.acquired
                                    ? "border-border bg-muted/30 opacity-50"
                                    : badge.isDisplayed
                                      ? "border-primary bg-primary/10"
                                      : "border-border hover:border-primary/50"
                                }`}
                              >
                                {badge.acquired && badge.isDisplayed && (
                                  <div className="absolute top-1 right-1">
                                    <Check className="h-3 w-3 text-primary" />
                                  </div>
                                )}
                                <div className="flex items-center gap-3 text-left">
                                  <span className={`text-2xl flex-shrink-0 ${!badge.acquired && "grayscale"}`}>
                                    {badge.icon}
                                  </span>
                                  <div className="min-w-0">
                                    <p className="text-xs font-medium truncate">{badge.name}</p>
                                    <p className="text-[10px] text-muted-foreground line-clamp-2">
                                      {badge.description}
                                    </p>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {myBadges.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <Award className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>배지 정보를 불러오는 중...</p>
                        </div>
                      )}
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {currentUser.favoriteCategories.map((category) => (
                  <BadgeUI key={category} variant="secondary" className="text-xs">
                    {category}
                  </BadgeUI>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Taste Score Card */}
        <TasteScoreCard user={currentUser} />

        {/* Quick Links */}
        <div className="grid grid-cols-4 gap-2">
          <Link href="/ranking">
            <Card className="p-3 hover:bg-secondary/50 transition-colors border border-border">
              <div className="flex flex-col items-center text-center">
                <p className="text-xs text-muted-foreground mb-1">{t.nav.ranking}</p>
                <p className="text-lg font-bold text-primary">#{currentUser.rank || '-'}</p>
              </div>
            </Card>
          </Link>
          <Link href="/follows">
            <Card className="p-3 hover:bg-secondary/50 transition-colors border border-border">
              <div className="flex flex-col items-center text-center">
                <p className="text-xs text-muted-foreground mb-1">{t.nav.friends}</p>
                <p className="text-lg font-bold text-primary">{followingCount}</p>
              </div>
            </Card>
          </Link>
          <Card className="p-3 border border-border">
            <div className="flex flex-col items-center text-center">
              <p className="text-xs text-muted-foreground mb-1">{t.profile.influence}</p>
              <p className="text-lg font-bold text-primary">{influenceStats?.totalReferenceCount || 0}</p>
            </div>
          </Card>
          <Link href="/playlists">
            <Card className="p-3 hover:bg-secondary/50 transition-colors border border-border">
              <div className="flex flex-col items-center text-center">
                <p className="text-xs text-muted-foreground mb-1">{t.common.list}</p>
                <ListMusic className="h-5 w-5 text-primary mt-1" />
              </div>
            </Card>
          </Link>
        </div>

        {/* Influence Stats */}
        {influenceStats && influenceStats.totalReferenceCount > 0 && (
          <Card className="p-4 border border-primary/30 bg-primary/5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {influenceStats.totalReferenceCount}{t.profile.influenceDesc}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t.profile.influencePoints} +{influenceStats.totalInfluencePoints}{t.profile.influencePointsDesc}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 bg-secondary">
            <TabsTrigger value="reviews">{t.review.myReviews}</TabsTrigger>
            <TabsTrigger value="history">{t.profile.scoreHistory}</TabsTrigger>
          </TabsList>

          <TabsContent value="reviews" className="mt-4 space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : reviews.length > 0 ? (
              reviews.map((review) => <ReviewCard key={review.id} review={review} />)
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">{t.profile.noReviewsYet}</p>
                <Link href="/write">
                  <Button className="bg-primary text-primary-foreground">{t.profile.writeFirstReview}</Button>
                </Link>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <ScoreHistory userId={currentUser.id} />
          </TabsContent>
        </Tabs>
      </div>
    </MobileLayout>
  )
}
