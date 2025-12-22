// 상수 정의

export const regions = [
  "전체",
  "서울",
  "부산",
  "인천",
  "대구",
  "대전",
  "광주",
  "울산",
  "세종",
  "경기",
]

export const categories = [
  "전체",
  "한식",
  "일식",
  "중식",
  "양식",
  "카페",
  "베이커리",
  "분식",
]

// 맛잘알 등급 정의
export interface TasteLevel {
  label: string
  color: string
  minScore: number
  maxScore: number
  bgColor: string
}

const TASTE_LEVELS: TasteLevel[] = [
  { label: "마스터", minScore: 2000, maxScore: 3000, color: "bg-primary text-primary-foreground", bgColor: "bg-primary/10" },
  { label: "전문가", minScore: 1500, maxScore: 2000, color: "bg-accent text-accent-foreground", bgColor: "bg-accent/30" },
  { label: "미식가", minScore: 1000, maxScore: 1500, color: "bg-secondary text-secondary-foreground", bgColor: "bg-secondary" },
  { label: "탐험가", minScore: 500, maxScore: 1000, color: "bg-muted text-muted-foreground", bgColor: "bg-muted" },
  { label: "입문자", minScore: 0, maxScore: 500, color: "bg-muted text-muted-foreground", bgColor: "bg-muted" },
]

// 맛잘알 등급 계산 (간단 버전 - Badge 표시용)
export function getTasteLevel(score: number): { label: string; color: string } {
  const level = TASTE_LEVELS.find(l => score >= l.minScore) || TASTE_LEVELS[TASTE_LEVELS.length - 1]
  return { label: level.label, color: level.color }
}

// 맛잘알 등급 계산 (상세 버전 - Progress 표시용)
export function getTasteLevelDetail(score: number): TasteLevel {
  return TASTE_LEVELS.find(l => score >= l.minScore) || TASTE_LEVELS[TASTE_LEVELS.length - 1]
}

// 날짜 포맷팅 (한국 시간 기준)
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Seoul'
  })
}

// 상대 시간 포맷팅 (예: "5분 전", "2시간 전")
export function formatRelativeTime(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return "방금 전"
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}일 전`

  return formatDate(dateString)
}

// 채팅 메시지 시간 포맷팅 (오전/오후 HH:MM)
export function formatMessageTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Seoul'
  })
}

// 채팅 날짜 구분 헤더 포맷팅
export function formatMessageDateHeader(dateString: string): string {
  const date = new Date(dateString)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const dateOnly = date.toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })
  const todayOnly = today.toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })
  const yesterdayOnly = yesterday.toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })

  if (dateOnly === todayOnly) return "오늘"
  if (dateOnly === yesterdayOnly) return "어제"

  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
    timeZone: 'Asia/Seoul'
  })
}
