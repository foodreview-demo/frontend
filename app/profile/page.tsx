"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Settings, MapPin, Edit2, ChevronRight, Loader2, ListMusic, Users, Award } from "lucide-react"
import { MobileLayout } from "@/components/mobile-layout"
import { TasteScoreCard } from "@/components/taste-score-card"
import { ScoreHistory } from "@/components/score-history"
import { ReviewCard } from "@/components/review-card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "@/lib/i18n-context"
import { api, Review, User, InfluenceStats, SimpleBadge } from "@/lib/api"

export default function ProfilePage() {
  const { user: currentUser } = useAuth()
  const t = useTranslation()
  const [activeTab, setActiveTab] = useState("reviews")
  const [reviews, setReviews] = useState<Review[]>([])
  const [followingCount, setFollowingCount] = useState(0)
  const [influenceStats, setInfluenceStats] = useState<InfluenceStats | null>(null)
  const [displayedBadges, setDisplayedBadges] = useState<SimpleBadge[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return
      setIsLoading(true)
      try {
        const [reviewsResult, followingsResult, influenceResult, badgesResult] = await Promise.all([
          api.getUserReviews(currentUser.id),
          api.getFollowings(currentUser.id),
          api.getInfluenceStats(currentUser.id),
          api.getDisplayedBadges(currentUser.id),
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
          setDisplayedBadges(badgesResult.data)
        }
      } catch (err) {
        console.error("프로필 데이터 로드 실패:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [currentUser])

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
            <div className="flex-1">
              <h2 className="text-xl font-bold text-foreground">{currentUser.name}</h2>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <MapPin className="h-4 w-4" />
                <span>{currentUser.region}</span>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {currentUser.favoriteCategories.map((category) => (
                  <Badge key={category} variant="secondary" className="text-xs">
                    {category}
                  </Badge>
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

        {/* Badges Section */}
        <Link href="/badges">
          <Card className="p-4 hover:bg-secondary/50 transition-colors border border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Award className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">배지</p>
                  {displayedBadges.length > 0 ? (
                    <div className="flex gap-1 mt-1">
                      {displayedBadges.map(badge => (
                        <span key={badge.id} className="text-lg">{badge.icon}</span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">배지를 선택해서 프로필에 표시하세요</p>
                  )}
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </Card>
        </Link>

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
