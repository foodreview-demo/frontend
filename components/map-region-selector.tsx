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
import {
  KOREA_REGIONS,
  KOREA_MAP_PATHS,
  REGION_DISTRICT_PATHS,
  REGION_VIEWBOX,
  REGION_TEXT_SCALE,
  REGION_HAS_RIVER,
  REGION_RIVER_PATH,
  SEOUL_DISTRICT_PATHS,
  DISTRICT_NEIGHBORHOOD_GROUPS,
  REGIONS_WITH_SVG_MAP,
  DistrictPath,
} from "@/lib/map-data"

export interface RegionSelection {
  region: string
  district?: string
  neighborhood?: string      // 실제 동 이름들 (콤마로 구분, 예: "서교동,합정동,상수동")
  neighborhoodLabel?: string // 표시용 라벨 (예: "홍대/합정")
}

interface MapRegionSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedRegion: RegionSelection
  onRegionChange: (selection: RegionSelection) => void
  userHomeNeighborhood?: string
}

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
    // 모든 지역에서 DISTRICT_NEIGHBORHOOD_GROUPS 사용
    const neighborhoodKey = `${tempRegion}_${district}`
    if (DISTRICT_NEIGHBORHOOD_GROUPS[neighborhoodKey]) {
      setCurrentView("neighborhood")
    } else {
      // 동 데이터가 없으면 구/군 선택으로 바로 적용
      onRegionChange({ region: tempRegion, district })
      onOpenChange(false)
    }
  }

  const handleNeighborhoodSelect = (label: string, neighborhoods: string[]) => {
    const neighborhoodStr = neighborhoods.join(",")
    setTempNeighborhood(neighborhoodStr)
    onRegionChange({
      region: tempRegion,
      district: tempDistrict,
      neighborhood: neighborhoodStr,
      neighborhoodLabel: label
    })
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

  // 해당 지역에 SVG 지도를 사용할지 확인 (서울, 경기만 SVG 지도 사용)
  const hasSvgMap = (regionName: string) => {
    return REGIONS_WITH_SVG_MAP.includes(regionName)
  }

  // 해당 지역에 구별 동네 묶음 데이터가 있는지 확인
  const hasNeighborhoodGroups = (regionName: string, districtName: string) => {
    const key = `${regionName}_${districtName}`
    return !!DISTRICT_NEIGHBORHOOD_GROUPS[key]
  }

  // 해당 지역에 구 지도 데이터가 있는지 확인
  const hasDistrictMap = (regionName: string) => {
    return !!REGION_DISTRICT_PATHS[regionName]
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
                {currentView === "district" && tempRegion}
                {currentView === "neighborhood" && tempDistrict}
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
                  <div className="absolute inset-0 flex items-center justify-center p-4">
                    <div className="relative w-full max-w-[260px] sm:max-w-[300px] aspect-[130/204]">
                      {/* 남한 지도 - southkorea/southkorea-maps 기반 */}
                      <svg viewBox="0 0 130 204" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                        <defs>
                          <linearGradient id="koreaFill" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#fef3c7" />
                            <stop offset="100%" stopColor="#fed7aa" />
                          </linearGradient>
                        </defs>

                        {/* 남한 본토 */}
                        <path
                          d={KOREA_MAP_PATHS.outline}
                          fill="url(#koreaFill)"
                          stroke="#f59e0b"
                          strokeWidth="1"
                          className="dark:fill-amber-900/40 dark:stroke-amber-600"
                        />

                        {/* 제주도 */}
                        <path
                          d={KOREA_MAP_PATHS.jeju}
                          fill="url(#koreaFill)"
                          stroke="#f59e0b"
                          strokeWidth="1"
                          className="dark:fill-amber-900/40 dark:stroke-amber-600"
                        />
                      </svg>

                      {/* 지역 버튼들 */}
                      {KOREA_REGIONS.map((region) => (
                        <button
                          key={region.name}
                          onClick={() => handleRegionSelect(region.name, region.hasDetail)}
                          className={cn(
                            "absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200",
                            "px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold whitespace-nowrap",
                            "hover:scale-110 hover:z-10",
                            region.hasDetail
                              ? "bg-primary text-primary-foreground shadow-lg"
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
                    <span className="text-primary font-semibold">서울, 부산, 인천, 대구, 대전, 광주, 울산, 경기</span>는 구/군 단위로 선택 가능
                  </p>
                </div>
              </div>
            )}

            {/* 구/군 SVG 지도 (서울, 경기만) */}
            {currentView === "district" && hasSvgMap(tempRegion) && (
              <div className="h-full flex flex-col">
                <div className="px-4 pt-2">
                  <Button variant="outline" className="w-full h-10 rounded-full border-dashed" onClick={handleRegionAll}>
                    {tempRegion} 전체에서 맛집 찾기
                  </Button>
                </div>

                <div className="flex-1 relative overflow-hidden p-2">
                  <div className="absolute inset-0 flex items-center justify-center p-4">
                    <div className="relative w-full max-w-[320px] sm:max-w-[380px]">
                      {/* 구/군 SVG 지도 */}
                      <svg
                        viewBox={REGION_VIEWBOX[tempRegion] || "0 0 200 200"}
                        className="w-full h-auto"
                        preserveAspectRatio="xMidYMid meet"
                      >
                        <defs>
                          <linearGradient id="districtFill" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#fef3c7" />
                            <stop offset="100%" stopColor="#fed7aa" />
                          </linearGradient>
                          <linearGradient id="districtHoverFill" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#fbbf24" />
                            <stop offset="100%" stopColor="#f59e0b" />
                          </linearGradient>
                        </defs>

                        {/* 한강 표시 (서울만) */}
                        {REGION_HAS_RIVER[tempRegion] && REGION_RIVER_PATH[tempRegion] && (
                          <path
                            d={REGION_RIVER_PATH[tempRegion]}
                            fill="none"
                            stroke="#93c5fd"
                            strokeWidth="4"
                            strokeLinecap="round"
                            className="dark:stroke-blue-500/60"
                          />
                        )}

                        {/* 각 구역 렌더링 */}
                        {REGION_DISTRICT_PATHS[tempRegion] && Object.entries(REGION_DISTRICT_PATHS[tempRegion]).map(([name, data]) => {
                          const count = getDistrictCount(name)
                          const isHovered = hoveredItem === name

                          return (
                            <g key={name}>
                              <path
                                d={data.d}
                                fill={isHovered ? "url(#districtHoverFill)" : "url(#districtFill)"}
                                stroke={isHovered ? "#ea580c" : "#f59e0b"}
                                strokeWidth={isHovered ? "2" : "1"}
                                className={cn(
                                  "cursor-pointer transition-all duration-200",
                                  "dark:fill-amber-900/40 dark:stroke-amber-600",
                                  isHovered && "dark:fill-amber-700/60"
                                )}
                                onClick={() => handleDistrictSelect(name)}
                                onMouseEnter={() => setHoveredItem(name)}
                                onMouseLeave={() => setHoveredItem(null)}
                              />
                            </g>
                          )
                        })}

                        {/* 구/군 이름 라벨 */}
                        {REGION_DISTRICT_PATHS[tempRegion] && Object.entries(REGION_DISTRICT_PATHS[tempRegion]).map(([name, data]) => {
                          const count = getDistrictCount(name)
                          const isHovered = hoveredItem === name
                          // 구/군/시 접미사 제거
                          const shortName = name.replace(/구$|군$|시$/, "")
                          // 지역별 텍스트 스케일 적용
                          const scale = REGION_TEXT_SCALE[tempRegion] || 1.0
                          const fontSize = 8 * scale
                          const countFontSize = 6 * scale

                          return (
                            <g key={`label-${name}`} className="pointer-events-none">
                              {/* 구/군 이름 */}
                              <text
                                x={data.cx}
                                y={data.cy + 2}
                                textAnchor="middle"
                                fontSize={fontSize}
                                className={cn(
                                  "font-bold",
                                  isHovered ? "fill-orange-700" : "fill-gray-700 dark:fill-gray-200"
                                )}
                              >
                                {shortName}
                              </text>
                              {/* 리뷰 수 */}
                              {count > 0 && (
                                <text
                                  x={data.cx}
                                  y={data.cy + 2 + fontSize}
                                  textAnchor="middle"
                                  fontSize={countFontSize}
                                  className="fill-primary font-bold"
                                >
                                  {count}
                                </text>
                              )}
                            </g>
                          )
                        })}
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="p-3 text-center border-t bg-white/50 dark:bg-gray-900/50">
                  <p className="text-xs text-muted-foreground">
                    {tempRegion === "서울" ? "구를 선택하면 동 단위로 볼 수 있어요" : "구/군을 선택하세요"}
                  </p>
                </div>
              </div>
            )}

            {/* 구/군 텍스트 리스트 (부산, 인천, 대구, 대전, 광주, 울산) */}
            {currentView === "district" && !hasSvgMap(tempRegion) && hasDistrictMap(tempRegion) && (
              <div className="h-full flex flex-col">
                <div className="px-4 pt-2 pb-3 border-b bg-white/50 dark:bg-gray-900/50">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{tempRegion}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRegionAll}
                      className="text-primary text-sm"
                    >
                      전체 &gt;
                    </Button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  <div className="p-2">
                    {/* 구/군 목록을 REGION_DISTRICT_PATHS에서 가져옴 */}
                    {REGION_DISTRICT_PATHS[tempRegion] && Object.keys(REGION_DISTRICT_PATHS[tempRegion]).map((districtName) => {
                      const count = getDistrictCount(districtName)

                      return (
                        <button
                          key={districtName}
                          onClick={() => handleDistrictSelect(districtName)}
                          className={cn(
                            "w-full text-left px-4 py-3 rounded-xl transition-all",
                            "hover:bg-amber-100/50 dark:hover:bg-amber-900/20",
                            "active:bg-amber-200/50 dark:active:bg-amber-800/30",
                            "border-b border-gray-100 dark:border-gray-800 last:border-0"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-foreground font-medium">
                              {districtName}
                            </span>
                            {count > 0 && (
                              <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                                {count}
                              </Badge>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="p-3 text-center border-t bg-white/50 dark:bg-gray-900/50">
                  <p className="text-xs text-muted-foreground">
                    구/군을 선택하면 동네를 선택할 수 있어요
                  </p>
                </div>
              </div>
            )}

            {/* 동 선택 - 모든 지역 (텍스트 리스트) */}
            {currentView === "neighborhood" && hasNeighborhoodGroups(tempRegion, tempDistrict) && (
              <div className="h-full flex flex-col">
                <div className="px-4 pt-2 pb-3 border-b bg-white/50 dark:bg-gray-900/50">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{tempDistrict}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDistrictAll}
                      className="text-primary text-sm"
                    >
                      전체 &gt;
                    </Button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  <div className="p-2">
                    {DISTRICT_NEIGHBORHOOD_GROUPS[`${tempRegion}_${tempDistrict}`]?.map((group, index) => (
                      <button
                        key={index}
                        onClick={() => handleNeighborhoodSelect(group.label, group.neighborhoods)}
                        className={cn(
                          "w-full text-left px-4 py-3 rounded-xl transition-all",
                          "hover:bg-amber-100/50 dark:hover:bg-amber-900/20",
                          "active:bg-amber-200/50 dark:active:bg-amber-800/30",
                          "border-b border-gray-100 dark:border-gray-800 last:border-0"
                        )}
                      >
                        <span className="text-sm text-foreground font-medium">
                          {group.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 text-center border-t bg-white/50 dark:bg-gray-900/50">
                  <p className="text-xs text-muted-foreground">동네를 선택하면 해당 지역 맛집을 볼 수 있어요</p>
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
