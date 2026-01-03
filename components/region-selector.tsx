"use client"

import { useState, useEffect } from "react"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getRegions, getDistricts, getNeighborhoods, getGyeonggiCities, getGyeonggiGus, isGyeonggiCityWithGu } from "@/lib/regions"
import { cn } from "@/lib/utils"

interface RegionSelectorProps {
  region: string
  district: string
  neighborhood: string
  onChange: (region: string, district: string, neighborhood: string) => void
  showNeighborhood?: boolean
  showAllOption?: boolean // "전체" 옵션 표시 여부
  className?: string
  size?: "sm" | "default"
}

export function RegionSelector({
  region,
  district,
  neighborhood,
  onChange,
  showNeighborhood = true,
  showAllOption = false,
  className,
  size = "default",
}: RegionSelectorProps) {
  const regions = getRegions()
  const isGyeonggi = region === "경기"

  // 경기도일 때: district가 "수원시 장안구" 형태면 시와 구 분리
  const [gyeonggiCity, setGyeonggiCity] = useState("")
  const [gyeonggiGu, setGyeonggiGu] = useState("")

  // district 변경 시 경기도 시/구 상태 동기화
  useEffect(() => {
    if (isGyeonggi && district) {
      if (district.includes(" ")) {
        // "수원시 장안구" 형태
        const [city, gu] = district.split(" ")
        setGyeonggiCity(city)
        setGyeonggiGu(gu)
      } else {
        // "남양주시" 형태 (구가 없는 시)
        setGyeonggiCity(district)
        setGyeonggiGu("")
      }
    } else if (!isGyeonggi) {
      setGyeonggiCity("")
      setGyeonggiGu("")
    }
  }, [isGyeonggi, district])

  // 경기도 시 목록
  const gyeonggiCities = isGyeonggi ? getGyeonggiCities() : []
  // 경기도 선택된 시의 구 목록
  const gyeonggiGus = isGyeonggi && gyeonggiCity ? getGyeonggiGus(gyeonggiCity) : []
  // 경기도 선택된 시가 구를 가진 대도시인지
  const hasGu = isGyeonggi && gyeonggiCity && isGyeonggiCityWithGu(gyeonggiCity)

  // 일반 시/도의 구/군 목록 (경기도 제외)
  const districts = !isGyeonggi ? getDistricts(region) : []

  // 동 목록
  const neighborhoods = getNeighborhoods(region, district)

  const handleRegionChange = (value: string) => {
    setGyeonggiCity("")
    setGyeonggiGu("")
    onChange(value, "", "")
  }

  const handleDistrictChange = (value: string) => {
    const newDistrict = value === "__all__" ? "" : value
    onChange(region, newDistrict, "")
  }

  // 경기도 시 선택
  const handleGyeonggiCityChange = (value: string) => {
    const newCity = value === "__all__" ? "" : value
    setGyeonggiCity(newCity)
    setGyeonggiGu("")

    if (!newCity) {
      onChange(region, "", "")
    } else if (isGyeonggiCityWithGu(newCity)) {
      // 구가 있는 대도시: 구 선택 대기
      onChange(region, "", "")
    } else {
      // 구가 없는 시: 바로 district로 설정
      onChange(region, newCity, "")
    }
  }

  // 경기도 구 선택
  const handleGyeonggiGuChange = (value: string) => {
    const newGu = value === "__all__" ? "" : value
    setGyeonggiGu(newGu)

    if (!newGu) {
      onChange(region, "", "")
    } else {
      // "수원시 장안구" 형태로 district 설정
      onChange(region, `${gyeonggiCity} ${newGu}`, "")
    }
  }

  const handleNeighborhoodChange = (value: string) => {
    const newNeighborhood = value === "__all__" ? "" : value
    onChange(region, district, newNeighborhood)
  }

  const triggerClass = size === "sm" ? "h-9 text-sm" : ""

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {/* 시/도 선택 */}
      <Select value={region} onValueChange={handleRegionChange}>
        <SelectTrigger className={cn("flex-1 min-w-[80px]", triggerClass)}>
          <SelectValue placeholder="시/도" />
        </SelectTrigger>
        <SelectContent>
          {regions.map((r) => (
            <SelectItem key={r} value={r}>{r}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* 경기도: 시 선택 */}
      {isGyeonggi && (
        <Select value={gyeonggiCity || (showAllOption ? "__all__" : "")} onValueChange={handleGyeonggiCityChange}>
          <SelectTrigger className={cn("flex-1 min-w-[100px]", triggerClass)}>
            <SelectValue placeholder="시/군" />
          </SelectTrigger>
          <SelectContent>
            {showAllOption && (
              <SelectItem value="__all__">전체</SelectItem>
            )}
            {gyeonggiCities.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* 경기도 대도시: 구 선택 */}
      {isGyeonggi && hasGu && (
        <Select value={gyeonggiGu || (showAllOption ? "__all__" : "")} onValueChange={handleGyeonggiGuChange}>
          <SelectTrigger className={cn("flex-1 min-w-[80px]", triggerClass)}>
            <SelectValue placeholder="구" />
          </SelectTrigger>
          <SelectContent>
            {showAllOption && (
              <SelectItem value="__all__">전체</SelectItem>
            )}
            {gyeonggiGus.map((g) => (
              <SelectItem key={g} value={g}>{g}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* 일반 시/도: 구/군 선택 */}
      {!isGyeonggi && (
        <Select value={district || (showAllOption ? "__all__" : "")} onValueChange={handleDistrictChange} disabled={!region}>
          <SelectTrigger className={cn("flex-1 min-w-[80px]", triggerClass)}>
            <SelectValue placeholder="구/군" />
          </SelectTrigger>
          <SelectContent>
            {showAllOption && (
              <SelectItem value="__all__">전체</SelectItem>
            )}
            {districts.map((d) => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* 동/읍/면 선택 */}
      {showNeighborhood && (
        <Select value={neighborhood || (showAllOption && district ? "__all__" : "")} onValueChange={handleNeighborhoodChange} disabled={!district}>
          <SelectTrigger className={cn("flex-1 min-w-[80px]", triggerClass)}>
            <SelectValue placeholder="동/읍/면" />
          </SelectTrigger>
          <SelectContent>
            {showAllOption && (
              <SelectItem value="__all__">전체</SelectItem>
            )}
            {neighborhoods.map((n) => (
              <SelectItem key={n} value={n}>{n}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  )
}

// 간단한 지역 표시 (읽기 전용)
export function RegionDisplay({
  region,
  district,
  neighborhood,
  className,
}: {
  region?: string
  district?: string
  neighborhood?: string
  className?: string
}) {
  const parts = [region, district, neighborhood].filter(Boolean)
  if (parts.length === 0) return null

  return (
    <span className={cn("text-muted-foreground", className)}>
      {parts.join(" ")}
    </span>
  )
}
