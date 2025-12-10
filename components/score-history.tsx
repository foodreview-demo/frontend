"use client"

import { useEffect, useState } from "react"
import { Heart, Sparkles, TrendingUp, Loader2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { api, ScoreEvent } from "@/lib/api"

interface ScoreHistoryProps {
  userId: number
}

export function ScoreHistory({ userId }: ScoreHistoryProps) {
  const [history, setHistory] = useState<ScoreEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true)
      try {
        const result = await api.getScoreHistory(userId)
        if (result.success) {
          setHistory(result.data.content)
        }
      } catch (err) {
        console.error("점수 내역 로드 실패:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchHistory()
  }, [userId])

  const getIcon = (type: string) => {
    switch (type) {
      case "FIRST_REVIEW":
      case "first_review":
        return <Sparkles className="h-4 w-4 text-primary" />
      case "SYMPATHY_BONUS":
      case "sympathy_bonus":
        return <TrendingUp className="h-4 w-4 text-accent-foreground" />
      default:
        return <Heart className="h-4 w-4 text-primary" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-foreground">점수 획득 내역</h3>

      <div className="space-y-2">
        {history.length > 0 ? (
          history.map((event) => (
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
          ))
        ) : (
          <Card className="p-8 text-center border border-border">
            <p className="text-muted-foreground">아직 점수 획득 내역이 없어요</p>
          </Card>
        )}
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
