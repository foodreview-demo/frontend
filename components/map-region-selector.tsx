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

// 서울시 25개 구 SVG 경로 데이터 (github.com/southkorea/southkorea-maps 기반)
const SEOUL_DISTRICT_PATHS: Record<string, { d: string; cx: number; cy: number; icon: string }> = {
  "강동구": { d: "M163.4,92.9L187.1,80.9L195.0,92.5L186.4,102.5L177.9,120.0L166.2,113.1L161.8,103.5L163.4,92.9Z", cx: 175.2, cy: 99.8, icon: "🌅" },
  "송파구": { d: "M142.3,115.0L156.8,113.4L161.8,103.5L166.2,113.1L177.9,120.0L185.6,130.5L175.7,147.1L167.6,152.4L161.6,137.8L143.6,127.5L142.3,115.0Z", cx: 161.9, cy: 125.0, icon: "🏟️" },
  "강남구": { d: "M118.4,113.4L121.7,107.0L133.0,101.6L139.7,95.4L142.3,102.7L143.7,106.9L142.3,115.0L143.6,127.5L161.6,137.8L167.6,152.4L150.4,175.1L138.1,184.9L131.7,181.5L127.9,168.9L117.3,142.6L118.4,113.4Z", cx: 140.7, cy: 139.8, icon: "💎" },
  "서초구": { d: "M81.9,130.7L94.3,119.9L98.6,121.7L109.2,117.7L118.4,113.4L117.3,142.6L127.9,168.9L131.7,181.5L104.7,191.7L91.5,172.8L95.9,167.9L90.7,155.3L81.9,130.7Z", cx: 107.2, cy: 152.9, icon: "⚖️" },
  "관악구": { d: "M63.1,147.0L73.9,140.2L81.9,130.7L90.7,155.3L95.9,167.9L91.5,172.8L76.0,175.3L68.9,175.3L61.4,168.5L63.1,147.0Z", cx: 77.6, cy: 157.6, icon: "📚" },
  "동작구": { d: "M60.4,123.4L75.4,118.1L81.9,130.7L73.9,140.2L63.1,147.0L56.6,140.5L60.4,123.4Z", cx: 68.0, cy: 131.2, icon: "🌳" },
  "금천구": { d: "M38.9,153.2L46.1,143.1L56.6,140.5L63.1,147.0L61.4,168.5L49.7,172.9L38.9,168.9L38.9,153.2Z", cx: 50.4, cy: 156.6, icon: "⚙️" },
  "영등포구": { d: "M36.7,113.9L46.9,107.9L60.4,111.6L60.4,123.4L56.6,140.5L46.1,143.1L38.9,153.2L29.7,143.4L28.7,127.2L36.7,113.9Z", cx: 44.9, cy: 127.0, icon: "🏙️" },
  "구로구": { d: "M4.7,137.2L18.5,127.3L28.7,127.2L29.7,143.4L38.9,153.2L38.9,168.9L30.2,175.2L16.8,175.7L9.9,162.9L4.7,137.2Z", cx: 22.1, cy: 152.5, icon: "🏭" },
  "양천구": { d: "M18.5,127.3L4.7,137.2L2.7,123.8L10.7,108.6L20.6,105.5L28.1,106.5L36.7,113.9L28.7,127.2L18.5,127.3Z", cx: 18.9, cy: 119.1, icon: "🏠" },
  "강서구": { d: "M2.7,123.8L4.7,137.2L18.5,127.3L28.7,127.2L36.7,113.9L28.1,106.5L20.6,105.5L10.7,108.6L2.7,123.8ZM0.0,95.5L5.5,88.3L12.9,82.9L20.0,84.4L24.7,98.2L20.6,105.5L10.7,108.6L5.4,103.9L0.0,95.5Z", cx: 14.9, cy: 103.9, icon: "✈️" },
  "마포구": { d: "M36.7,113.9L46.9,107.9L54.3,91.5L52.7,83.4L42.5,78.9L39.1,81.9L29.1,78.6L28.8,87.7L36.7,113.9Z", cx: 40.9, cy: 95.0, icon: "🎸" },
  "용산구": { d: "M60.4,111.6L75.4,118.1L74.9,99.1L68.9,92.5L60.2,93.9L54.3,91.5L60.4,111.6Z", cx: 65.8, cy: 105.1, icon: "🗼" },
  "성동구": { d: "M94.5,83.7L100.7,78.9L108.7,78.8L115.9,72.9L121.2,81.9L118.3,91.6L118.4,97.7L109.2,99.9L99.3,101.9L91.9,96.9L94.5,83.7Z", cx: 107.0, cy: 88.4, icon: "🌉" },
  "광진구": { d: "M121.2,81.9L132.9,74.9L140.6,82.5L148.5,81.9L156.8,89.0L156.8,113.4L142.3,102.7L139.7,95.4L133.0,101.6L121.7,107.0L118.4,97.7L118.3,91.6L121.2,81.9Z", cx: 137.9, cy: 94.4, icon: "🎡" },
  "동대문구": { d: "M99.3,101.9L109.2,99.9L118.4,97.7L121.7,107.0L118.4,113.4L109.2,117.7L98.6,121.7L94.3,119.9L91.9,96.9L99.3,101.9Z", cx: 106.3, cy: 109.5, icon: "🛍️" },
  "중랑구": { d: "M118.4,97.7L133.0,101.6L139.7,95.4L142.3,102.7L156.8,113.4L142.3,115.0L143.7,106.9L142.3,102.7L133.0,101.6L121.7,107.0L118.4,97.7Z", cx: 135.5, cy: 105.5, icon: "🌸" },
  "중구": { d: "M68.9,92.5L74.9,99.1L91.9,96.9L94.3,119.9L81.9,130.7L75.4,118.1L60.4,111.6L54.3,91.5L60.2,93.9L68.9,92.5Z", cx: 74.7, cy: 107.4, icon: "🏢" },
  "서대문구": { d: "M39.1,81.9L42.5,78.9L52.7,83.4L54.3,91.5L60.2,93.9L68.9,92.5L74.9,99.1L75.4,118.1L60.4,111.6L60.4,123.4L36.7,113.9L28.8,87.7L39.1,81.9Z", cx: 52.1, cy: 99.5, icon: "🚪" },
  "은평구": { d: "M28.8,87.7L29.1,78.6L39.1,81.9L42.5,78.9L52.7,83.4L58.5,68.2L52.0,55.2L39.9,54.1L28.7,54.9L22.7,63.5L28.8,87.7Z", cx: 38.3, cy: 69.7, icon: "🏡" },
  "종로구": { d: "M52.7,83.4L54.3,91.5L68.9,92.5L74.9,99.1L91.9,96.9L99.3,101.9L91.9,96.9L94.5,83.7L88.3,77.9L79.3,75.8L68.4,77.2L58.5,68.2L52.7,83.4Z", cx: 74.7, cy: 85.2, icon: "👑" },
  "성북구": { d: "M68.4,77.2L79.3,75.8L88.3,77.9L94.5,83.7L100.7,78.9L94.9,66.7L85.9,58.8L78.9,58.0L68.4,60.2L59.8,57.7L52.0,55.2L58.5,68.2L68.4,77.2Z", cx: 77.6, cy: 69.5, icon: "🎓" },
  "강북구": { d: "M59.8,57.7L68.4,60.2L78.9,58.0L85.9,58.8L85.9,48.1L73.9,33.4L67.5,36.5L59.8,39.8L53.5,45.6L59.8,57.7Z", cx: 70.9, cy: 48.0, icon: "🏛️" },
  "도봉구": { d: "M67.5,36.5L73.9,33.4L85.9,48.1L85.9,58.8L94.9,66.7L100.7,78.9L94.5,83.7L88.3,77.9L79.3,75.8L68.4,77.2L68.4,60.2L78.9,58.0L85.9,58.8L85.9,48.1L73.9,33.4L67.5,36.5Z", cx: 80.2, cy: 43.3, icon: "🏔️" },
  "노원구": { d: "M85.9,48.1L85.9,58.8L94.9,66.7L100.7,78.9L108.7,78.8L115.9,72.9L113.9,56.7L103.5,47.2L85.9,48.1Z", cx: 99.8, cy: 62.2, icon: "🌲" },
}

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

// 전국 지도 데이터 (SVG viewBox 0 0 130 204 기준, 퍼센트 좌표)
const KOREA_REGIONS = [
  { name: "강원", x: 73, y: 18, hasDetail: false },
  { name: "경기", x: 38, y: 28, hasDetail: false },
  { name: "서울", x: 33, y: 21, hasDetail: true },
  { name: "인천", x: 16, y: 21, hasDetail: false },
  { name: "충북", x: 50, y: 36, hasDetail: false },
  { name: "경북", x: 75, y: 45, hasDetail: false },
  { name: "세종", x: 38, y: 42, hasDetail: false },
  { name: "충남", x: 24, y: 52, hasDetail: false },
  { name: "대전", x: 42, y: 46, hasDetail: false },
  { name: "전북", x: 35, y: 58, hasDetail: false },
  { name: "대구", x: 72, y: 56, hasDetail: false },
  { name: "울산", x: 88, y: 62, hasDetail: false },
  { name: "광주", x: 28, y: 70, hasDetail: false },
  { name: "경남", x: 62, y: 66, hasDetail: false },
  { name: "부산", x: 82, y: 69, hasDetail: false },
  { name: "전남", x: 28, y: 80, hasDetail: false },
  { name: "제주", x: 20, y: 95, hasDetail: false },
]

// 남한 지도 SVG path 데이터 (github.com/southkorea/southkorea-maps)
const KOREA_MAP_PATHS = {
  outline: "M31.1,51c0.3-3.5-1.3-5.5-3.8-5.6c-2.5-0.2-2.2,5.2-6.6,0c-4.4-5.2-0.8-4.9-1.5-6.2c-0.7-1.3-3.7-0.7-4.6-1.3c-0.8-0.7-2-1.5-0.7-3c1.4-1.5,1.7-2.5,3-3.9c1.4-1.3,2.4,0.6,4-0.7c0.6-0.5,1-3,2.7-2.2s2.6,2.4,3.2,3.2c0,0,0.7,1.4,3,0.9l0,0l0.2-0.1c4.2-2,4.5-3.7,2.9-5.5c-1.6-1.8-1.1,0,2.9-2.7c4-2.7,1.6-3.5-1.2-4.8s-0.7-2.1,0-2.2c0.9-0.2,3.3-1.8,3.9-2.2s9-2.5,9-2.5l0.2-0.1c2.4-1.3,3.8-2.8,4.7-1.6c0.8,1.2,2.7,2.4,4.7,0.5c2-1.9,5.1-1.8,5.2-0.8c0.2,1,0.8,2.2,3.5,2c2.7-0.2,11.3,0.4,11.3-2.7c0-3.1,4.7-3.2,5.6-2.4c0.8,0.8,1.3,4.5,2-0.4c0.7-5,2.7-8.2,5.1-2.4c2.4,5.7,1.7,6.2,2.9,7.4c1.2,1.2,1.9,3.2,1.9,5.2c0,2,4.6,6.1,6.2,8.6c1.7,2.5,6.4,7.1,7.8,8.8c1,1.2,2.2,7.4,4.2,10.3c2,2.9,4.3,3.4,5.9,9.1c0.7,2.6,0.8,2.8,0.8,2.8l0.1,0.1c0,0,1.3,2.9,2.6,4c1.3,1.1,0.1,6.2,0,6.9c-0.1,0.7-1,1.6,0.2,2.7c1.5,1.4,0.3,6.2,0,8.9c-0.3,2.7,1.7,6.8,0.7,8.6c-1,1.9-2.3-0.5-2,4c0.3,4.6,0.8,6.3,1.2,7.6c0.3,1.3-0.2,2.7,0.3,3.7c0.5,1,3.2-0.5,3.4-1.7c0.2-1.2,2.5-1.3,2.2,1c-0.3,2.4,1.2,3.4,0,5.7c-1.2,2.4-0.9,3.5-1.9,5.4c-1,1.9-1.9,1.4-0.8,3.2c0,0,0.3,0.8,0.2,1.4c-0.2,3-0.4,6.9-1.8,8.2c-2,1.8-2.3,2.1-2,2.8c0.7,1.4-1.5,4.2-1.5,4.2l-0.3,0.8c-1.1,2.7-1.9,4.1-1.9,4.1c-1.6,4.1-3.7,3.6-4,3.1c-0.4-0.5-3-0.7-3,0.6c0,1.3-1.6,2.2-1.6,2.2c-5.4,1.5-6.6,3.1-6.6,3.1l-0.2,0.2c-0.6,0.6-0.6,3.4-0.6,3.4c-0.2,5.2-3.4,9.3-5.9,9.2s-7.2-0.1-7.8-3.7s-2.5-1.9-3.2-1.3c-0.8,0.6-3.9,1.2-4.8,1c-0.9-0.1-1.9,0.6-2.1,2.5c0,0,0.7,1.9-1.7,0.8c-2.4-1.1-4.1-1-5.8-0.6v0l-0.2,1c-0.7,1.4-0.7,5.2-7.6,3c-6.9-2.2-2.5,2-2.7,4.6c-0.2,2.5-1.3,3.7-4.9,2.4c-3.5-1.3-2,2-3.7,2c-1.7,0-4.6-0.3-5.1,0.5c-0.5,0.8,0.2,3.4-1.3,4.2c-1.5,0.8-2.5,0.7-6.1,0.5c-3.5-0.2-8.9-0.2-8.9-0.2l-5.4-2c0,0-3.4-1.7-4.4-1.5c-1,0.2-4.9,1.3-6.1,1.3c-1.2,0,5.4,6.3-3.7,5.6c-4.9,4.6-6.5,1.8-6.8,0c-0.2-0.8-3.3,1-1.9-2.5c1.4-3.5,3.4-7.9,5.7-9.1c0.8-0.4,3.7-1.9-0.5-3.2c-4.2-1.3-1.7-2-1.7-3.9c0-1.9-0.8-1.5-1.5-3c-0.7-1.5-0.2-2.4,0.7-3.2c0.9-0.8,2.9,0.3,2.4-4.4c-0.2-1.4,0.5-1.1,2.2-1.5c2.8-0.7,3.4-2.7,0.7-4.2c-2.7-1.5-4.2-4-0.7-4.4c3.5-0.3,5.1,0.5,7.1,0c2-0.5,4.6-1,3-4.2c-1.5-3.2,1.9-4.2,2-5.2s-0.9-0.8,0-2.5c0.2-0.3,0.7-0.6,0.7-0.6s0.2-2.2,0.8-2.8c0.7-0.6,1.4-0.4,0.9-2.5c-0.5-2.2,2.6-4,2.8-4.1c0.1-0.1,5.3-3.8,1.5-8.8c0,0-4.4-3.8-1.3-4.2l3.5-0.8l0,0L27,101c-3.9-3.6-2.4-4.1-1.2-4.9c1.2-0.8,1-5.4-2.7-5.7c-3.7-0.3-5.9-4.2-4.6-7.3c1.4-3-0.7-5.7-3.2-4.1c-2.5,1.7-2.5-1.7-2.2-4c0.3-2.4-0.2-4.9,1-6.1c0.7-0.7,7.3-6.1,7.9-6.4c0.7-0.3,1.9-1.3,5.2,0c3.4,1.3,4.1,1.6,4.4,1.7c0,0,1,0.3,1.9,0.1c0.3-0.1,0-0.5,0-0.5c-0.1-0.4-3.5-4.1-4.6-5.8c-1.2-1.7-0.5-3.1,0.9-3.6C31.2,53.9,31.1,51,31.1,51z",
  jeju: "M21.5,189.2c0,0-2.2,3.3-6.1,3.9c-3.9,0.6-2.5,5.8-0.3,7.2c2.2,1.4,3,3.7,6.1,1.6c1.6-1.1,4.8,0.1,8.8-0.3c1.6-0.1,11.5-4.8,10.8-8.9c-0.8-4.1-2.7-6.6-7-5.3c-4.3,1.3-7.5,1.1-8.7,1.1C23.8,188.6,22.8,188.3,21.5,189.2z",
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
                            region.name === "서울"
                              ? "bg-primary text-primary-foreground shadow-lg scale-110 px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm"
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
                  <div className="absolute inset-0 flex items-center justify-center p-4">
                    <div className="relative w-full max-w-[320px] sm:max-w-[380px]">
                      {/* 서울 구 SVG 지도 */}
                      <svg viewBox="0 30 200 165" className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
                        <defs>
                          <linearGradient id="seoulFill" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#fef3c7" />
                            <stop offset="100%" stopColor="#fed7aa" />
                          </linearGradient>
                          <linearGradient id="seoulHoverFill" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#fbbf24" />
                            <stop offset="100%" stopColor="#f59e0b" />
                          </linearGradient>
                        </defs>

                        {/* 한강 표시 */}
                        <path
                          d="M30,108 Q60,115 100,105 Q140,95 170,110"
                          fill="none"
                          stroke="#93c5fd"
                          strokeWidth="4"
                          strokeLinecap="round"
                          className="dark:stroke-blue-500/60"
                        />

                        {/* 각 구역 렌더링 */}
                        {Object.entries(SEOUL_DISTRICT_PATHS).map(([name, data]) => {
                          const count = getDistrictCount(name)
                          const isHovered = hoveredItem === name

                          return (
                            <g key={name}>
                              <path
                                d={data.d}
                                fill={isHovered ? "url(#seoulHoverFill)" : "url(#seoulFill)"}
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

                        {/* 구 이름 라벨 */}
                        {Object.entries(SEOUL_DISTRICT_PATHS).map(([name, data]) => {
                          const count = getDistrictCount(name)
                          const isHovered = hoveredItem === name

                          return (
                            <g key={`label-${name}`} className="pointer-events-none">
                              {/* 이모지 아이콘 */}
                              <text
                                x={data.cx}
                                y={data.cy - 5}
                                textAnchor="middle"
                                className="text-[10px] sm:text-[12px]"
                              >
                                {data.icon}
                              </text>
                              {/* 구 이름 */}
                              <text
                                x={data.cx}
                                y={data.cy + 8}
                                textAnchor="middle"
                                className={cn(
                                  "text-[6px] sm:text-[8px] font-bold",
                                  isHovered ? "fill-orange-700" : "fill-gray-700 dark:fill-gray-200"
                                )}
                              >
                                {name.replace("구", "")}
                              </text>
                              {/* 리뷰 수 */}
                              {count > 0 && (
                                <text
                                  x={data.cx}
                                  y={data.cy + 16}
                                  textAnchor="middle"
                                  className="text-[5px] sm:text-[6px] fill-primary font-bold"
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
                  <div className="absolute inset-2 flex items-center justify-center">
                    <div className="relative w-full max-w-[340px] sm:max-w-[400px] aspect-square">
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
                              "px-1.5 py-1 sm:px-2.5 sm:py-1.5 rounded-xl transition-all",
                              "bg-white dark:bg-gray-700 shadow-md border-2",
                              isHovered ? "border-primary shadow-lg bg-primary/5" : "border-amber-200/70 dark:border-amber-700/50"
                            )}>
                              <span className={cn(
                                "text-[10px] sm:text-xs font-semibold whitespace-nowrap",
                                isHovered && "text-primary"
                              )}>
                                {dong.name}
                              </span>
                              {count > 0 && (
                                <span className="text-[9px] sm:text-[10px] text-primary font-bold ml-1">
                                  {count}
                                </span>
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>
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
