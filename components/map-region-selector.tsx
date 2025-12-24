"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, Navigation, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { api, DistrictCount, NeighborhoodCount } from "@/lib/api"

export interface RegionSelection {
  region: string
  district?: string
  neighborhood?: string
}

interface MapRegionSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedRegion: RegionSelection
  onRegionChange: (selection: RegionSelection) => void
  userHomeNeighborhood?: string
}

// 서울시 구 위치 (실제 지리적 위치 기반으로 정밀 조정)
const SEOUL_DISTRICTS = [
  { name: "도봉구", x: 62, y: 3, icon: "🏔️" },
  { name: "노원구", x: 75, y: 10, icon: "🌲" },
  { name: "강북구", x: 52, y: 12, icon: "🏛️" },
  { name: "성북구", x: 58, y: 24, icon: "🎓" },
  { name: "중랑구", x: 78, y: 28, icon: "🌸" },
  { name: "은평구", x: 32, y: 20, icon: "🏡" },
  { name: "종로구", x: 45, y: 30, icon: "👑" },
  { name: "동대문구", x: 68, y: 32, icon: "🛍️" },
  { name: "광진구", x: 82, y: 40, icon: "🎡" },
  { name: "서대문구", x: 32, y: 38, icon: "🚪" },
  { name: "중구", x: 52, y: 42, icon: "🏢" },
  { name: "성동구", x: 68, y: 46, icon: "🌉" },
  { name: "강동구", x: 92, y: 48, icon: "🌅" },
  { name: "마포구", x: 25, y: 48, icon: "🎸" },
  { name: "용산구", x: 45, y: 52, icon: "🗼" },
  { name: "송파구", x: 85, y: 62, icon: "🏟️" },
  { name: "강서구", x: 8, y: 52, icon: "✈️" },
  { name: "양천구", x: 15, y: 62, icon: "🏠" },
  { name: "영등포구", x: 28, y: 62, icon: "🏙️" },
  { name: "동작구", x: 42, y: 68, icon: "🌳" },
  { name: "강남구", x: 70, y: 68, icon: "💎" },
  { name: "구로구", x: 12, y: 75, icon: "🏭" },
  { name: "금천구", x: 25, y: 82, icon: "⚙️" },
  { name: "관악구", x: 40, y: 82, icon: "📚" },
  { name: "서초구", x: 55, y: 78, icon: "⚖️" },
]

// 각 구의 동 위치 데이터 (실제 지리적 위치 기반)
const DISTRICT_NEIGHBORHOODS: Record<string, Array<{ name: string; x: number; y: number }>> = {
  "강남구": [
    { name: "압구정동", x: 25, y: 8 },
    { name: "청담동", x: 50, y: 10 },
    { name: "삼성동", x: 70, y: 15 },
    { name: "신사동", x: 15, y: 25 },
    { name: "논현동", x: 35, y: 30 },
    { name: "역삼동", x: 55, y: 35 },
    { name: "대치동", x: 78, y: 40 },
    { name: "도곡동", x: 60, y: 55 },
    { name: "개포동", x: 80, y: 60 },
    { name: "일원동", x: 90, y: 75 },
    { name: "수서동", x: 75, y: 80 },
    { name: "세곡동", x: 55, y: 90 },
  ],
  "강동구": [
    { name: "암사동", x: 70, y: 10 },
    { name: "명일동", x: 50, y: 25 },
    { name: "고덕동", x: 80, y: 30 },
    { name: "상일동", x: 90, y: 45 },
    { name: "길동", x: 30, y: 45 },
    { name: "둔촌동", x: 50, y: 55 },
    { name: "천호동", x: 20, y: 65 },
    { name: "성내동", x: 40, y: 75 },
    { name: "강일동", x: 85, y: 70 },
  ],
  "강북구": [
    { name: "우이동", x: 70, y: 10 },
    { name: "수유동", x: 50, y: 30 },
    { name: "번동", x: 70, y: 50 },
    { name: "미아동", x: 40, y: 60 },
    { name: "삼양동", x: 25, y: 45 },
    { name: "송중동", x: 55, y: 75 },
    { name: "송천동", x: 35, y: 85 },
  ],
  "강서구": [
    { name: "방화동", x: 30, y: 15 },
    { name: "공항동", x: 55, y: 20 },
    { name: "마곡동", x: 75, y: 35 },
    { name: "가양동", x: 70, y: 55 },
    { name: "등촌동", x: 85, y: 70 },
    { name: "화곡동", x: 50, y: 70 },
    { name: "염창동", x: 90, y: 85 },
  ],
  "관악구": [
    { name: "신림동", x: 40, y: 35 },
    { name: "봉천동", x: 65, y: 50 },
    { name: "남현동", x: 80, y: 25 },
    { name: "서원동", x: 25, y: 60 },
    { name: "신원동", x: 50, y: 80 },
  ],
  "광진구": [
    { name: "광장동", x: 70, y: 15 },
    { name: "구의동", x: 45, y: 30 },
    { name: "자양동", x: 25, y: 45 },
    { name: "화양동", x: 30, y: 65 },
    { name: "군자동", x: 55, y: 70 },
    { name: "중곡동", x: 75, y: 80 },
  ],
  "구로구": [
    { name: "신도림동", x: 80, y: 15 },
    { name: "구로동", x: 55, y: 35 },
    { name: "가리봉동", x: 70, y: 50 },
    { name: "고척동", x: 25, y: 30 },
    { name: "개봉동", x: 20, y: 55 },
    { name: "오류동", x: 15, y: 75 },
    { name: "궁동", x: 40, y: 80 },
    { name: "항동", x: 60, y: 85 },
  ],
  "금천구": [
    { name: "가산동", x: 50, y: 25 },
    { name: "독산동", x: 40, y: 55 },
    { name: "시흥동", x: 60, y: 75 },
  ],
  "노원구": [
    { name: "상계동", x: 45, y: 20 },
    { name: "중계동", x: 65, y: 40 },
    { name: "하계동", x: 50, y: 55 },
    { name: "공릉동", x: 35, y: 70 },
    { name: "월계동", x: 55, y: 85 },
  ],
  "도봉구": [
    { name: "도봉동", x: 50, y: 20 },
    { name: "방학동", x: 35, y: 45 },
    { name: "쌍문동", x: 55, y: 60 },
    { name: "창동", x: 65, y: 80 },
  ],
  "동대문구": [
    { name: "이문동", x: 70, y: 15 },
    { name: "휘경동", x: 55, y: 25 },
    { name: "회기동", x: 40, y: 35 },
    { name: "청량리동", x: 30, y: 50 },
    { name: "전농동", x: 55, y: 55 },
    { name: "장안동", x: 75, y: 50 },
    { name: "답십리동", x: 45, y: 70 },
    { name: "용두동", x: 25, y: 80 },
    { name: "제기동", x: 60, y: 85 },
  ],
  "동작구": [
    { name: "흑석동", x: 70, y: 20 },
    { name: "노량진동", x: 45, y: 25 },
    { name: "상도동", x: 35, y: 50 },
    { name: "대방동", x: 20, y: 40 },
    { name: "신대방동", x: 15, y: 65 },
    { name: "사당동", x: 55, y: 75 },
  ],
  "마포구": [
    { name: "상암동", x: 35, y: 12 },
    { name: "성산동", x: 55, y: 25 },
    { name: "망원동", x: 70, y: 35 },
    { name: "연남동", x: 60, y: 48 },
    { name: "합정동", x: 75, y: 55 },
    { name: "서교동", x: 65, y: 65 },
    { name: "마포동", x: 85, y: 75 },
    { name: "공덕동", x: 80, y: 85 },
    { name: "아현동", x: 90, y: 60 },
    { name: "도화동", x: 88, y: 45 },
    { name: "용강동", x: 78, y: 42 },
  ],
  "서대문구": [
    { name: "홍은동", x: 45, y: 15 },
    { name: "홍제동", x: 35, y: 30 },
    { name: "북가좌동", x: 20, y: 25 },
    { name: "남가좌동", x: 25, y: 45 },
    { name: "연희동", x: 55, y: 50 },
    { name: "신촌동", x: 70, y: 65 },
    { name: "북아현동", x: 75, y: 80 },
    { name: "충정로", x: 85, y: 90 },
  ],
  "서초구": [
    { name: "잠원동", x: 30, y: 10 },
    { name: "반포동", x: 45, y: 25 },
    { name: "서초동", x: 60, y: 45 },
    { name: "방배동", x: 30, y: 55 },
    { name: "양재동", x: 75, y: 65 },
    { name: "내곡동", x: 85, y: 85 },
  ],
  "성동구": [
    { name: "옥수동", x: 20, y: 25 },
    { name: "금호동", x: 30, y: 40 },
    { name: "응봉동", x: 45, y: 30 },
    { name: "왕십리", x: 55, y: 20 },
    { name: "행당동", x: 65, y: 35 },
    { name: "사근동", x: 75, y: 50 },
    { name: "성수동", x: 70, y: 65 },
    { name: "송정동", x: 85, y: 75 },
    { name: "용답동", x: 90, y: 55 },
  ],
  "성북구": [
    { name: "성북동", x: 40, y: 15 },
    { name: "삼선동", x: 30, y: 35 },
    { name: "동선동", x: 45, y: 30 },
    { name: "돈암동", x: 55, y: 40 },
    { name: "안암동", x: 35, y: 50 },
    { name: "보문동", x: 25, y: 65 },
    { name: "정릉동", x: 60, y: 20 },
    { name: "길음동", x: 70, y: 45 },
    { name: "종암동", x: 55, y: 60 },
    { name: "월곡동", x: 75, y: 65 },
    { name: "장위동", x: 85, y: 50 },
    { name: "석관동", x: 90, y: 70 },
  ],
  "송파구": [
    { name: "풍납동", x: 20, y: 15 },
    { name: "잠실동", x: 35, y: 25 },
    { name: "신천동", x: 25, y: 40 },
    { name: "석촌동", x: 40, y: 45 },
    { name: "삼전동", x: 55, y: 35 },
    { name: "송파동", x: 50, y: 55 },
    { name: "가락동", x: 70, y: 50 },
    { name: "문정동", x: 65, y: 70 },
    { name: "장지동", x: 80, y: 75 },
    { name: "방이동", x: 45, y: 75 },
    { name: "오금동", x: 60, y: 85 },
  ],
  "양천구": [
    { name: "신월동", x: 30, y: 30 },
    { name: "신정동", x: 55, y: 50 },
    { name: "목동", x: 70, y: 70 },
  ],
  "영등포구": [
    { name: "여의도동", x: 55, y: 15 },
    { name: "당산동", x: 75, y: 30 },
    { name: "문래동", x: 60, y: 45 },
    { name: "영등포동", x: 45, y: 55 },
    { name: "양평동", x: 30, y: 40 },
    { name: "신길동", x: 40, y: 70 },
    { name: "대림동", x: 25, y: 85 },
    { name: "도림동", x: 55, y: 80 },
  ],
  "용산구": [
    { name: "이촌동", x: 25, y: 20 },
    { name: "서빙고동", x: 50, y: 15 },
    { name: "한남동", x: 75, y: 25 },
    { name: "이태원동", x: 65, y: 45 },
    { name: "한강로", x: 35, y: 50 },
    { name: "용산동", x: 45, y: 65 },
    { name: "효창동", x: 30, y: 75 },
    { name: "원효로", x: 20, y: 60 },
    { name: "청파동", x: 25, y: 85 },
    { name: "남영동", x: 50, y: 85 },
    { name: "후암동", x: 60, y: 75 },
    { name: "용문동", x: 40, y: 40 },
  ],
  "은평구": [
    { name: "진관동", x: 35, y: 10 },
    { name: "수색동", x: 70, y: 25 },
    { name: "증산동", x: 60, y: 40 },
    { name: "신사동", x: 45, y: 35 },
    { name: "역촌동", x: 55, y: 55 },
    { name: "응암동", x: 70, y: 60 },
    { name: "대조동", x: 40, y: 55 },
    { name: "구산동", x: 30, y: 45 },
    { name: "갈현동", x: 50, y: 70 },
    { name: "불광동", x: 65, y: 80 },
    { name: "녹번동", x: 80, y: 85 },
  ],
  "종로구": [
    { name: "평창동", x: 30, y: 10 },
    { name: "부암동", x: 20, y: 25 },
    { name: "삼청동", x: 55, y: 20 },
    { name: "사직동", x: 35, y: 40 },
    { name: "교남동", x: 25, y: 55 },
    { name: "무악동", x: 15, y: 45 },
    { name: "혜화동", x: 70, y: 35 },
    { name: "명륜동", x: 65, y: 50 },
    { name: "창신동", x: 80, y: 55 },
    { name: "종로1가", x: 50, y: 60 },
    { name: "종로2가", x: 55, y: 70 },
    { name: "수송동", x: 45, y: 75 },
    { name: "서린동", x: 40, y: 85 },
    { name: "청진동", x: 55, y: 85 },
    { name: "중학동", x: 60, y: 80 },
  ],
  "중구": [
    { name: "회현동", x: 30, y: 25 },
    { name: "명동", x: 45, y: 35 },
    { name: "소공동", x: 35, y: 20 },
    { name: "을지로동", x: 55, y: 30 },
    { name: "필동", x: 60, y: 50 },
    { name: "장충동", x: 75, y: 45 },
    { name: "광희동", x: 80, y: 60 },
    { name: "신당동", x: 70, y: 70 },
    { name: "황학동", x: 85, y: 75 },
    { name: "중림동", x: 20, y: 55 },
  ],
  "중랑구": [
    { name: "신내동", x: 75, y: 15 },
    { name: "망우동", x: 85, y: 35 },
    { name: "묵동", x: 60, y: 30 },
    { name: "중화동", x: 45, y: 45 },
    { name: "상봉동", x: 55, y: 60 },
    { name: "면목동", x: 35, y: 75 },
  ],
}

// 전국 지도 데이터
const KOREA_REGIONS = [
  { name: "서울", x: 35, y: 28, hasDetail: true },
  { name: "인천", x: 23, y: 32, hasDetail: false },
  { name: "경기", x: 40, y: 20, hasDetail: false },
  { name: "강원", x: 62, y: 18, hasDetail: false },
  { name: "충북", x: 50, y: 40, hasDetail: false },
  { name: "충남", x: 28, y: 45, hasDetail: false },
  { name: "세종", x: 38, y: 42, hasDetail: false },
  { name: "대전", x: 42, y: 50, hasDetail: false },
  { name: "전북", x: 30, y: 58, hasDetail: false },
  { name: "대구", x: 62, y: 55, hasDetail: false },
  { name: "경북", x: 68, y: 38, hasDetail: false },
  { name: "울산", x: 75, y: 58, hasDetail: false },
  { name: "경남", x: 55, y: 68, hasDetail: false },
  { name: "부산", x: 70, y: 70, hasDetail: false },
  { name: "전남", x: 28, y: 75, hasDetail: false },
  { name: "광주", x: 30, y: 67, hasDetail: false },
  { name: "제주", x: 25, y: 93, hasDetail: false },
]

export function MapRegionSelector({
  open,
  onOpenChange,
  selectedRegion,
  onRegionChange,
  userHomeNeighborhood,
}: MapRegionSelectorProps) {
  const [currentView, setCurrentView] = useState<"region" | "district" | "neighborhood">("region")
  const [tempRegion, setTempRegion] = useState(selectedRegion.region)
  const [tempDistrict, setTempDistrict] = useState(selectedRegion.district || "")
  const [tempNeighborhood, setTempNeighborhood] = useState(selectedRegion.neighborhood || "")
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  const [districtCounts, setDistrictCounts] = useState<DistrictCount[]>([])
  const [neighborhoodCounts, setNeighborhoodCounts] = useState<NeighborhoodCount[]>([])

  useEffect(() => {
    if (open) {
      setTempRegion(selectedRegion.region)
      setTempDistrict(selectedRegion.district || "")
      setTempNeighborhood(selectedRegion.neighborhood || "")
      if (selectedRegion.neighborhood) {
        setCurrentView("neighborhood")
      } else if (selectedRegion.district) {
        setCurrentView("neighborhood")
      } else if (selectedRegion.region !== "전체") {
        setCurrentView("district")
      } else {
        setCurrentView("region")
      }
    }
  }, [open, selectedRegion])

  useEffect(() => {
    if (!open || tempRegion === "전체" || currentView !== "district") return
    const loadDistrictCounts = async () => {
      try {
        const result = await api.getReviewCountByDistrict(tempRegion)
        if (result.success) setDistrictCounts(result.data)
      } catch (err) {
        console.error("구별 리뷰 수 로드 실패:", err)
      }
    }
    loadDistrictCounts()
  }, [open, tempRegion, currentView])

  useEffect(() => {
    if (!open || !tempRegion || !tempDistrict || currentView !== "neighborhood") return
    const loadNeighborhoodCounts = async () => {
      try {
        const result = await api.getReviewCountByNeighborhood(tempRegion, tempDistrict)
        if (result.success) setNeighborhoodCounts(result.data)
      } catch (err) {
        console.error("동별 리뷰 수 로드 실패:", err)
      }
    }
    loadNeighborhoodCounts()
  }, [open, tempRegion, tempDistrict, currentView])

  const handleRegionSelect = (region: string, hasDetail: boolean) => {
    setTempRegion(region)
    setTempDistrict("")
    setTempNeighborhood("")
    if (hasDetail) {
      setCurrentView("district")
    } else {
      onRegionChange({ region })
      onOpenChange(false)
    }
  }

  const handleDistrictSelect = (district: string) => {
    setTempDistrict(district)
    setTempNeighborhood("")
    setCurrentView("neighborhood")
  }

  const handleNeighborhoodSelect = (neighborhood: string) => {
    setTempNeighborhood(neighborhood)
    onRegionChange({ region: tempRegion, district: tempDistrict, neighborhood })
    onOpenChange(false)
  }

  const handleDistrictAll = () => {
    onRegionChange({ region: tempRegion, district: tempDistrict })
    onOpenChange(false)
  }

  const handleRegionAll = () => {
    onRegionChange({ region: tempRegion })
    onOpenChange(false)
  }

  const handleBack = () => {
    if (currentView === "neighborhood") {
      setCurrentView("district")
      setTempNeighborhood("")
    } else if (currentView === "district") {
      setCurrentView("region")
      setTempDistrict("")
    }
  }

  const handleReset = () => {
    onRegionChange({ region: "전체" })
    onOpenChange(false)
  }

  const getDistrictCount = (district: string) => districtCounts.find(d => d.district === district)?.count || 0
  const getNeighborhoodCount = (neighborhood: string) => neighborhoodCounts.find(n => n.neighborhood === neighborhood)?.count || 0

  // 구 아이콘 찾기
  const getDistrictIcon = (districtName: string) => {
    return SEOUL_DISTRICTS.find(d => d.name === districtName)?.icon || "📍"
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[80vh] p-0 rounded-t-3xl">
        <div className="flex flex-col h-full bg-gradient-to-b from-amber-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
          {/* 헤더 */}
          <SheetHeader className="p-4 flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              {currentView !== "region" && (
                <Button variant="ghost" size="icon" onClick={handleBack} className="h-8 w-8 rounded-full">
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              )}
              <SheetTitle className="text-lg font-bold flex items-center gap-2">
                {currentView === "region" && "어디로 갈까요?"}
                {currentView === "district" && (
                  <>
                    <span className="text-2xl">🗼</span>
                    {tempRegion}
                  </>
                )}
                {currentView === "neighborhood" && (
                  <>
                    <span className="text-2xl">{getDistrictIcon(tempDistrict)}</span>
                    {tempDistrict}
                  </>
                )}
              </SheetTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={handleReset} className="text-muted-foreground">
              초기화
            </Button>
          </SheetHeader>

          {/* 컨텐츠 */}
          <div className="flex-1 overflow-hidden">
            {/* 전국 지도 */}
            {currentView === "region" && (
              <div className="h-full flex flex-col">
                <div className="flex-1 relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative w-full max-w-sm aspect-[3/4]">
                      {/* 한반도 외곽선 */}
                      <svg viewBox="0 0 100 100" className="w-full h-full">
                        <path
                          d="M30 5 Q50 0 70 8 Q80 15 75 30 Q78 45 72 55 Q75 70 65 80 Q50 85 40 75 Q25 80 20 70 Q15 55 25 45 Q20 30 25 15 Z"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="0.5"
                          className="text-amber-300 dark:text-amber-700"
                        />
                        <ellipse cx="28" cy="92" rx="8" ry="4" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-amber-300 dark:text-amber-700" />
                      </svg>

                      {/* 지역 버튼들 */}
                      {KOREA_REGIONS.map((region) => (
                        <button
                          key={region.name}
                          onClick={() => handleRegionSelect(region.name, region.hasDetail)}
                          className={cn(
                            "absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200",
                            "px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap",
                            "hover:scale-110 hover:z-10",
                            region.name === "서울"
                              ? "bg-primary text-primary-foreground shadow-lg scale-110 px-3 py-1.5 text-sm"
                              : "bg-white/90 dark:bg-gray-700/90 text-foreground shadow-md hover:bg-primary hover:text-primary-foreground"
                          )}
                          style={{ left: `${region.x}%`, top: `${region.y}%` }}
                        >
                          {region.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    <span className="text-primary font-semibold">서울</span>은 구/동 단위로 선택 가능
                  </p>
                </div>
              </div>
            )}

            {/* 서울 구 지도 */}
            {currentView === "district" && tempRegion === "서울" && (
              <div className="h-full flex flex-col">
                <div className="px-4 pt-2">
                  <Button variant="outline" className="w-full h-10 rounded-full border-dashed" onClick={handleRegionAll}>
                    서울 전체에서 맛집 찾기
                  </Button>
                </div>

                <div className="flex-1 relative overflow-hidden p-2">
                  <div className="relative w-full h-full">
                    {/* 한강 표시 */}
                    <div className="absolute top-[48%] left-[20%] w-[65%] h-[3px] bg-blue-300/60 dark:bg-blue-500/40 rounded-full transform -rotate-6" />

                    {/* 구 버튼들 */}
                    {SEOUL_DISTRICTS.map((district) => {
                      const count = getDistrictCount(district.name)
                      const isHovered = hoveredItem === district.name

                      return (
                        <button
                          key={district.name}
                          onClick={() => handleDistrictSelect(district.name)}
                          onMouseEnter={() => setHoveredItem(district.name)}
                          onMouseLeave={() => setHoveredItem(null)}
                          className={cn(
                            "absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200",
                            "flex flex-col items-center",
                            "hover:scale-110 hover:z-20",
                            isHovered && "z-20"
                          )}
                          style={{ left: `${district.x}%`, top: `${district.y}%` }}
                        >
                          <div className={cn(
                            "w-9 h-9 rounded-full flex items-center justify-center transition-all",
                            "bg-white dark:bg-gray-700 shadow-md border-2",
                            isHovered ? "border-primary shadow-lg scale-110" : "border-amber-200/70 dark:border-amber-700/50"
                          )}>
                            <span className="text-base">{district.icon}</span>
                          </div>
                          <span className={cn(
                            "text-[9px] font-semibold mt-0.5 px-1.5 py-0.5 rounded-full transition-all whitespace-nowrap",
                            isHovered ? "bg-primary text-primary-foreground" : "bg-white/90 dark:bg-gray-800/90"
                          )}>
                            {district.name.replace("구", "")}
                          </span>
                          {count > 0 && (
                            <Badge variant="secondary" className="text-[8px] px-1 py-0 h-3.5 mt-0.5">
                              {count}
                            </Badge>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="p-3 text-center border-t bg-white/50 dark:bg-gray-900/50">
                  <p className="text-xs text-muted-foreground">구를 선택하면 동 단위로 볼 수 있어요</p>
                </div>
              </div>
            )}

            {/* 동 지도 */}
            {currentView === "neighborhood" && (
              <div className="h-full flex flex-col">
                <div className="px-4 pt-2">
                  <Button variant="outline" className="w-full h-10 rounded-full border-dashed" onClick={handleDistrictAll}>
                    {tempDistrict} 전체에서 맛집 찾기
                  </Button>
                </div>

                <div className="flex-1 relative overflow-hidden p-2">
                  <div className="relative w-full h-full">
                    {/* 동 버튼들 */}
                    {DISTRICT_NEIGHBORHOODS[tempDistrict]?.map((dong) => {
                      const count = getNeighborhoodCount(dong.name)
                      const isHovered = hoveredItem === dong.name

                      return (
                        <button
                          key={dong.name}
                          onClick={() => handleNeighborhoodSelect(dong.name)}
                          onMouseEnter={() => setHoveredItem(dong.name)}
                          onMouseLeave={() => setHoveredItem(null)}
                          className={cn(
                            "absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200",
                            "flex flex-col items-center",
                            "hover:scale-110 hover:z-20",
                            isHovered && "z-20"
                          )}
                          style={{ left: `${dong.x}%`, top: `${dong.y}%` }}
                        >
                          <div className={cn(
                            "px-2.5 py-1.5 rounded-xl transition-all",
                            "bg-white dark:bg-gray-700 shadow-md border-2",
                            isHovered ? "border-primary shadow-lg bg-primary/5" : "border-amber-200/70 dark:border-amber-700/50"
                          )}>
                            <span className={cn(
                              "text-xs font-semibold whitespace-nowrap",
                              isHovered && "text-primary"
                            )}>
                              {dong.name}
                            </span>
                            {count > 0 && (
                              <span className="text-[10px] text-primary font-bold ml-1">
                                {count}
                              </span>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="p-3 text-center border-t bg-white/50 dark:bg-gray-900/50">
                  <p className="text-xs text-muted-foreground">동을 선택하면 해당 지역 맛집을 볼 수 있어요</p>
                </div>
              </div>
            )}
          </div>

          {/* 하단 퀵 버튼 */}
          <div className="p-4 border-t bg-white/80 dark:bg-gray-900/80 backdrop-blur">
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 gap-2 rounded-full"
                onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      () => {
                        setTempRegion("서울")
                        setCurrentView("district")
                      },
                      () => alert("위치 정보를 가져올 수 없습니다")
                    )
                  }
                }}
              >
                <Navigation className="h-4 w-4" />
                현재 위치
              </Button>
              {userHomeNeighborhood && (
                <Button
                  variant="outline"
                  className="flex-1 gap-2 rounded-full"
                  onClick={() => {
                    const parts = userHomeNeighborhood.split(" ")
                    if (parts.length >= 2) {
                      setTempRegion(parts[0])
                      setTempDistrict(parts[1])
                      if (parts.length >= 3) {
                        setTempNeighborhood(parts.slice(2).join(" "))
                      }
                      setCurrentView("neighborhood")
                    }
                  }}
                >
                  <Home className="h-4 w-4" />
                  내 동네
                </Button>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
