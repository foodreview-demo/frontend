"use client"

import { Heart, Sparkles, TrendingUp } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ScoreEvent {
  id: string
  type: "first_review" | "sympathy_received" | "sympathy_bonus"
  description: string
  points: number
  date: string
  from?: {
    name: string
    score: number
  }
}

const mockScoreHistory: ScoreEvent[] = [
  {
    id: "1",
    type: "sympathy_bonus",
    description: "마스터 등급 유저의 공감",
    points: 25,
    date: "오늘 14:30",
    from: { name: "맛탐험가", score: 2450 },
  },
  {
    id: "2",
    type: "sympathy_received",
    description: "리뷰 공감 획득",
    points: 10,
    date: "오늘 12:15",
    from: { name: "동네미식가", score: 1820 },
  },
  {
    id: "3",
    type: "first_review",
    description: "첫 리뷰 보너스 (스시오마카세)",
    points: 100,
    date: "어제 18:45",
  },
  {
    id: "4",
    type: "sympathy_received",
    description: "리뷰 공감 획득",
    points: 5,
    date: "어제 10:20",
    from: { name: "카페투어러", score: 1420 },
  },
]

export function ScoreHistory() {
  const getIcon = (type: ScoreEvent["type"]) => {
    switch (type) {
      case "first_review":
        return <Sparkles className="h-4 w-4 text-primary" />
      case "sympathy_bonus":
        return <TrendingUp className="h-4 w-4 text-accent-foreground" />
      default:
        return <Heart className="h-4 w-4 text-primary" />
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-foreground">점수 획득 내역</h3>

      <div className="space-y-2">
        {mockScoreHistory.map((event) => (
          <Card key={event.id} className="p-3 flex items-center gap-3 border border-border">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              {getIcon(event.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{event.description}</p>
              {event.from && (
                <p className="text-xs text-muted-foreground">
                  {event.from.name} ({event.from.score.toLocaleString()}점)
                </p>
              )}
            </div>
            <div className="text-right">
              <Badge variant="secondary" className="bg-primary/10 text-primary font-semibold">
                +{event.points}
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">{event.date}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Score Explanation */}
      <Card className="p-4 bg-secondary/50 border-0 mt-4">
        <h4 className="font-semibold text-foreground mb-3 text-sm">점수 획득 방법</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-primary mt-0.5" />
            <span>
              <strong className="text-foreground">첫 리뷰 작성:</strong> 기본 50점 × 2배 = 100점
            </span>
          </li>
          <li className="flex items-start gap-2">
            <Heart className="h-4 w-4 text-primary mt-0.5" />
            <span>
              <strong className="text-foreground">공감 받기:</strong> 공감한 유저 점수의 0.5%
            </span>
          </li>
          <li className="flex items-start gap-2">
            <TrendingUp className="h-4 w-4 text-primary mt-0.5" />
            <span>
              <strong className="text-foreground">마스터 공감:</strong> 추가 보너스 점수
            </span>
          </li>
        </ul>
      </Card>
    </div>
  )
}
