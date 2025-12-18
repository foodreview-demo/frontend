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
import { getRegions, getDistricts, getNeighborhoods } from "@/lib/regions"
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
  const districts = getDistricts(region)
  const neighborhoods = getNeighborhoods(region, district)

  const handleRegionChange = (value: string) => {
    onChange(value, "", "")
  }

  const handleDistrictChange = (value: string) => {
    // "전체" 선택 시 빈 문자열로 처리
    const newDistrict = value === "__all__" ? "" : value
    onChange(region, newDistrict, "")
  }

  const handleNeighborhoodChange = (value: string) => {
    // "전체" 선택 시 빈 문자열로 처리
    const newNeighborhood = value === "__all__" ? "" : value
    onChange(region, district, newNeighborhood)
  }

  const selectClass = size === "sm" ? "h-9 text-sm" : ""
  const triggerClass = size === "sm" ? "h-9 text-sm" : ""

  return (
    <div className={cn("flex gap-2", className)}>
      <Select value={region} onValueChange={handleRegionChange}>
        <SelectTrigger className={cn("flex-1", triggerClass)}>
          <SelectValue placeholder="시/도" />
        </SelectTrigger>
        <SelectContent>
          {regions.map((r) => (
            <SelectItem key={r} value={r}>{r}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={district || (showAllOption ? "__all__" : "")} onValueChange={handleDistrictChange} disabled={!region}>
        <SelectTrigger className={cn("flex-1", triggerClass)}>
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

      {showNeighborhood && (
        <Select value={neighborhood || (showAllOption && district ? "__all__" : "")} onValueChange={handleNeighborhoodChange} disabled={!district}>
          <SelectTrigger className={cn("flex-1", triggerClass)}>
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
