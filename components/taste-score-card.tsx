"use client"

import { TrendingUp, Award, Heart, FileText } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { User } from "@/lib/mock-data"

interface TasteScoreCardProps {
  user: User
  showDetails?: boolean
}

function getTasteLevel(score: number): {
  label: string
  minScore: number
  maxScore: number
  color: string
  bgColor: string
} {
  if (score >= 2000)
    return {
      label: "마스터",
      minScore: 2000,
      maxScore: 3000,
      color: "text-primary",
      bgColor: "bg-primary/10",
    }
  if (score >= 1500)
    return {
      label: "전문가",
      minScore: 1500,
      maxScore: 2000,
      color: "text-accent-foreground",
      bgColor: "bg-accent/30",
    }
  if (score >= 1000)
    return {
      label: "미식가",
      minScore: 1000,
      maxScore: 1500,
      color: "text-foreground",
      bgColor: "bg-secondary",
    }
  if (score >= 500)
    return {
      label: "탐험가",
      minScore: 500,
      maxScore: 1000,
      color: "text-muted-foreground",
      bgColor: "bg-muted",
    }
  return {
    label: "입문자",
    minScore: 0,
    maxScore: 500,
    color: "text-muted-foreground",
    bgColor: "bg-muted",
  }
}

export function TasteScoreCard({ user, showDetails = true }: TasteScoreCardProps) {
  const level = getTasteLevel(user.tasteScore)
  const progress = ((user.tasteScore - level.minScore) / (level.maxScore - level.minScore)) * 100

  return (
    <Card className={`p-4 ${level.bgColor} border-0`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Award className={`h-6 w-6 ${level.color}`} />
          <span className={`font-bold text-lg ${level.color}`}>{level.label}</span>
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
              <span className="font-bold">892</span>
            </div>
            <p className="text-xs text-muted-foreground">받은 공감</p>
          </div>
        </div>
      )}
    </Card>
  )
}
