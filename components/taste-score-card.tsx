"use client"

import { TrendingUp, Award, Heart, FileText } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { User } from "@/lib/api"
import { getTasteLevelDetail } from "@/lib/constants"

interface TasteScoreCardProps {
  user: User
  showDetails?: boolean
}

// color 클래스를 text-* 형식으로 변환
function getTextColor(level: string): string {
  switch (level) {
    case "마스터": return "text-primary"
    case "전문가": return "text-accent-foreground"
    case "미식가": return "text-foreground"
    default: return "text-muted-foreground"
  }
}

export function TasteScoreCard({ user, showDetails = true }: TasteScoreCardProps) {
  const level = getTasteLevelDetail(user.tasteScore)
  const textColor = getTextColor(level.label)
  const progress = ((user.tasteScore - level.minScore) / (level.maxScore - level.minScore)) * 100

  return (
    <Card className={`p-4 ${level.bgColor} border-0`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Award className={`h-6 w-6 ${textColor}`} />
          <span className={`font-bold text-lg ${textColor}`}>{level.label}</span>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-foreground">{user.tasteScore.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">맛잘알 점수</p>
        </div>
      </div>

      {/* Progress to next level */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{level.label}</span>
          <span>
            {level.maxScore.toLocaleString()}점까지 {(level.maxScore - user.tasteScore).toLocaleString()}점
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {showDetails && (
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/50">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-primary mb-1">
              <FileText className="h-4 w-4" />
              <span className="font-bold">{user.reviewCount}</span>
            </div>
            <p className="text-xs text-muted-foreground">작성 리뷰</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-primary mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="font-bold">#{user.rank}</span>
            </div>
            <p className="text-xs text-muted-foreground">지역 순위</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-primary mb-1">
              <Heart className="h-4 w-4" />
              <span className="font-bold">{user.receivedSympathyCount ?? 0}</span>
            </div>
            <p className="text-xs text-muted-foreground">받은 공감</p>
          </div>
        </div>
      )}
    </Card>
  )
}
