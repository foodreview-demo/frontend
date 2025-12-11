"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import Script from "next/script"
import { Search, Star, MapPin, Sparkles, Loader2, Navigation, X, ChevronUp, ChevronDown, Home, PenSquare, ListMusic, User } from "lucide-react"
import { MobileLayout } from "@/components/mobile-layout"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { api, Restaurant } from "@/lib/api"
import { cn } from "@/lib/utils"

const KAKAO_MAP_API_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY

interface KakaoPlace {
  id: string
  name: string
  category: string
  phone: string
  address: string
  roadAddress: string
  x: string
  y: string
  distance: string
}

interface NearbyRestaurant {
  kakaoPlace: KakaoPlace
  dbRestaurant?: Restaurant
}

type SortType = "distance" | "rating" | "reviews"
type SheetState = "collapsed" | "half" | "full"

export default function SearchPage() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const overlaysRef = useRef<any[]>([])
  const placesServiceRef = useRef<any>(null)
  const sheetRef = useRef<HTMLDivElement>(null)

  const [isScriptLoaded, setIsScriptLoaded] = useState(false)
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number } | null>(null)
  const [nearbyRestaurants, setNearbyRestaurants] = useState<NearbyRestaurant[]>([])
  const [dbRestaurants, setDbRestaurants] = useState<Restaurant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortType, setSortType] = useState<SortType>("distance")
  const [selectedPlace, setSelectedPlace] = useState<NearbyRestaurant | null>(null)
  const [sheetState, setSheetState] = useState<SheetState>("half")

  // DB에서 모든 음식점 가져오기
  useEffect(() => {
    const fetchDbRestaurants = async () => {
      try {
        const result = await api.getRestaurants(undefined, undefined, 0, 100)
        if (result.success) {
          setDbRestaurants(result.data.content)
        }
      } catch (err) {
        console.error("DB 음식점 로드 실패:", err)
      }
    }
    fetchDbRestaurants()
  }, [])

  // 지도 초기화
  const initializeMap = useCallback(() => {
    if (!mapRef.current) return
    const kakao = (window as any).kakao
    if (!kakao || !kakao.maps) return

    try {
      const defaultPosition = new kakao.maps.LatLng(37.5665, 126.9780)
      const mapInstance = new kakao.maps.Map(mapRef.current, {
        center: defaultPosition,
        level: 4
      })
      const placesService = new kakao.maps.services.Places()

      mapInstanceRef.current = mapInstance
      placesServiceRef.current = placesService
      setIsMapLoaded(true)

      // 현재 위치 가져오기
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords
            setCurrentPosition({ lat: latitude, lng: longitude })
            const currentPos = new kakao.maps.LatLng(latitude, longitude)
            mapInstance.setCenter(currentPos)

            // 현재 위치 마커
            new kakao.maps.CustomOverlay({
              position: currentPos,
              content: `<div style="width:16px;height:16px;background:#3B82F6;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(59,130,246,0.5);"></div>`,
              yAnchor: 0.5,
              map: mapInstance
            })

            searchNearbyPlaces(latitude, longitude)
          },
          () => {
            setIsLoading(false)
            searchNearbyPlaces(37.5665, 126.9780)
          },
          { enableHighAccuracy: true, timeout: 10000 }
        )
      } else {
        setIsLoading(false)
        searchNearbyPlaces(37.5665, 126.9780)
      }
    } catch (err) {
      console.error("지도 초기화 오류:", err)
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const kakao = (window as any).kakao
    if (kakao && kakao.maps) {
      if (kakao.maps.services) {
        initializeMap()
      } else {
        kakao.maps.load(() => initializeMap())
      }
      setIsScriptLoaded(true)
    } else if (isScriptLoaded) {
      const newKakao = (window as any).kakao
      if (newKakao && newKakao.maps) {
        newKakao.maps.load(() => initializeMap())
      }
    }
  }, [isScriptLoaded, initializeMap])

  // 주변 음식점 검색 (내 주변)
  const searchNearbyPlaces = useCallback((lat: number, lng: number) => {
    const places = placesServiceRef.current
    const kakao = (window as any).kakao
    if (!places || !kakao) return

    setIsLoading(true)
    const location = new kakao.maps.LatLng(lat, lng)

    places.categorySearch('FD6', (results: any[], status: string) => {
      setIsLoading(false)
      if (status === kakao.maps.services.Status.OK) {
        const kakaoPlaces: KakaoPlace[] = results.map((r: any) => ({
          id: r.id,
          name: r.place_name,
          category: r.category_name,
          phone: r.phone,
          address: r.address_name,
          roadAddress: r.road_address_name,
          x: r.x,
          y: r.y,
          distance: r.distance || "0"
        }))

        const matched: NearbyRestaurant[] = kakaoPlaces.map(kp => {
          const dbMatch = dbRestaurants.find(db =>
            db.name === kp.name ||
            db.address.includes(kp.roadAddress?.split(' ').slice(0, 3).join(' ') || '')
          )
          return { kakaoPlace: kp, dbRestaurant: dbMatch }
        })

        setNearbyRestaurants(matched)
        displayMarkers(matched)
      } else {
        setNearbyRestaurants([])
      }
    }, {
      location,
      radius: 1000,
      size: 15,
      sort: kakao.maps.services.SortBy.DISTANCE
    })
  }, [dbRestaurants])

  // 두 좌표 간 거리 계산 (Haversine 공식)
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371000 // 지구 반경 (미터)
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return Math.round(R * c)
  }

  // 키워드 검색 (전국)
  const searchByKeyword = useCallback((keyword: string) => {
    const places = placesServiceRef.current
    const kakao = (window as any).kakao
    const map = mapInstanceRef.current
    if (!places || !kakao || !keyword.trim()) return

    setIsLoading(true)

    places.keywordSearch(keyword, (results: any[], status: string) => {
      setIsLoading(false)
      if (status === kakao.maps.services.Status.OK) {
        const kakaoPlaces: KakaoPlace[] = results.map((r: any) => {
          // 현재 위치 기준 거리 계산
          let distance = "0"
          if (currentPosition) {
            distance = String(calculateDistance(
              currentPosition.lat,
              currentPosition.lng,
              parseFloat(r.y),
              parseFloat(r.x)
            ))
          }
          return {
            id: r.id,
            name: r.place_name,
            category: r.category_name,
            phone: r.phone,
            address: r.address_name,
            roadAddress: r.road_address_name,
            x: r.x,
            y: r.y,
            distance
          }
        })

        const matched: NearbyRestaurant[] = kakaoPlaces.map(kp => {
          const dbMatch = dbRestaurants.find(db =>
            db.name === kp.name ||
            db.address.includes(kp.roadAddress?.split(' ').slice(0, 3).join(' ') || '')
          )
          return { kakaoPlace: kp, dbRestaurant: dbMatch }
        })

        setNearbyRestaurants(matched)
        displayMarkers(matched)

        // 검색 결과로 지도 이동
        if (results.length > 0 && map) {
          const bounds = new kakao.maps.LatLngBounds()
          results.forEach((r: any) => {
            bounds.extend(new kakao.maps.LatLng(parseFloat(r.y), parseFloat(r.x)))
          })
          map.setBounds(bounds)
        }
      } else {
        setNearbyRestaurants([])
      }
    }, {
      size: 15
    })
  }, [dbRestaurants, currentPosition])

  // 마커 표시
  const displayMarkers = useCallback((restaurants: NearbyRestaurant[]) => {
    const map = mapInstanceRef.current
    const kakao = (window as any).kakao
    if (!map || !kakao) return

    overlaysRef.current.forEach(o => o.setMap(null))
    overlaysRef.current = []

    restaurants.forEach((restaurant) => {
      const { kakaoPlace, dbRestaurant } = restaurant
      const position = new kakao.maps.LatLng(
        parseFloat(kakaoPlace.y),
        parseFloat(kakaoPlace.x)
      )

      const hasReview = dbRestaurant && dbRestaurant.reviewCount > 0
      const isFirstReview = dbRestaurant?.reviewCount === 0
      const rating = dbRestaurant?.averageRating || 0

      let bgColor = "rgba(107,114,128,0.9)"
      let labelText = kakaoPlace.name.length > 5 ? kakaoPlace.name.slice(0, 5) + '..' : kakaoPlace.name

      if (hasReview) {
        bgColor = "rgba(249,115,22,0.95)"
        labelText = `★ ${rating}`
      } else if (isFirstReview) {
        bgColor = "rgba(139,92,246,0.95)"
        labelText = "첫리뷰"
      }

      const content = document.createElement('div')
      content.className = 'map-marker'
      content.innerHTML = `
        <div style="
          cursor:pointer;
          background:${bgColor};
          color:white;
          padding:6px 10px;
          border-radius:20px;
          font-size:12px;
          font-weight:600;
          white-space:nowrap;
          box-shadow:0 2px 12px rgba(0,0,0,0.25);
          backdrop-filter:blur(4px);
          transition:transform 0.15s ease;
        " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
          ${labelText}
        </div>
      `
      content.onclick = () => {
        setSelectedPlace(restaurant)
        setSheetState("collapsed")
        map.panTo(position)
      }

      const overlay = new kakao.maps.CustomOverlay({
        position,
        content,
        yAnchor: 1.2,
        map
      })

      overlaysRef.current.push(overlay)
    })
  }, [])

  const sortedRestaurants = [...nearbyRestaurants].sort((a, b) => {
    switch (sortType) {
      case "distance":
        return parseInt(a.kakaoPlace.distance) - parseInt(b.kakaoPlace.distance)
      case "rating":
        return (b.dbRestaurant?.averageRating || 0) - (a.dbRestaurant?.averageRating || 0)
      case "reviews":
        return (b.dbRestaurant?.reviewCount || 0) - (a.dbRestaurant?.reviewCount || 0)
      default:
        return 0
    }
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // 키워드가 있으면 전국 검색
      searchByKeyword(searchQuery)
    } else if (currentPosition) {
      // 키워드 없으면 내 주변 검색
      searchNearbyPlaces(currentPosition.lat, currentPosition.lng)
    }
  }

  const moveToCurrentLocation = () => {
    const kakao = (window as any).kakao
    const map = mapInstanceRef.current
    if (!kakao || !map) return

    setSearchQuery("") // 검색어 초기화

    // GPS 위치 새로 요청
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setCurrentPosition({ lat: latitude, lng: longitude })
          const pos = new kakao.maps.LatLng(latitude, longitude)
          map.setCenter(pos)
          map.setLevel(4)
          searchNearbyPlaces(latitude, longitude)
        },
        () => {
          // 실패 시 기존 위치 사용
          if (currentPosition) {
            const pos = new kakao.maps.LatLng(currentPosition.lat, currentPosition.lng)
            map.setCenter(pos)
            map.setLevel(4)
            searchNearbyPlaces(currentPosition.lat, currentPosition.lng)
          }
        },
        { enableHighAccuracy: true, timeout: 10000 }
      )
    } else if (currentPosition) {
      const pos = new kakao.maps.LatLng(currentPosition.lat, currentPosition.lng)
      map.setCenter(pos)
      map.setLevel(4)
      searchNearbyPlaces(currentPosition.lat, currentPosition.lng)
    }
  }

  const formatDistance = (distance: string) => {
    const d = parseInt(distance)
    return d >= 1000 ? `${(d / 1000).toFixed(1)}km` : `${d}m`
  }

  const toggleSheet = () => {
    if (sheetState === "collapsed") setSheetState("half")
    else if (sheetState === "half") setSheetState("full")
    else setSheetState("half")
  }

  const getSheetHeight = () => {
    switch (sheetState) {
      case "collapsed": return "calc(60px + 64px)" // 60px content + 64px nav
      case "half": return "calc(45% + 64px)"
      case "full": return "calc(85% + 64px)"
    }
  }

  return (
    <div className="h-screen w-full max-w-md mx-auto relative overflow-hidden bg-background">
      <Script
        src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_API_KEY}&libraries=services&autoload=false`}
        strategy="afterInteractive"
        onLoad={() => setIsScriptLoaded(true)}
      />

      {/* 검색 헤더 - 지도 위에 플로팅 */}
      <div className="absolute top-0 left-0 right-0 z-20 p-3">
        <form onSubmit={handleSearch} className="relative">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="flex items-center px-4 py-3">
              <Search className="h-5 w-5 text-gray-400 mr-3" />
              <Input
                placeholder="음식점, 메뉴 검색"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-0 p-0 h-auto text-base focus-visible:ring-0 placeholder:text-gray-400"
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery("")} className="p-1">
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* 현위치 버튼 */}
      <button
        onClick={moveToCurrentLocation}
        className="absolute right-3 top-20 z-20 bg-white w-10 h-10 rounded-full shadow-lg flex items-center justify-center border border-gray-100 active:scale-95 transition-transform"
      >
        <Navigation className="h-5 w-5 text-gray-600" />
      </button>

      {/* 지도 */}
      <div ref={mapRef} className="absolute inset-0 z-0" />
      {!isMapLoaded && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-100">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      )}

      {/* 선택된 음식점 카드 */}
      {selectedPlace && (
        <div className="absolute bottom-32 left-3 right-3 z-30 animate-in slide-in-from-bottom-4 duration-200">
          <SelectedPlaceCard
            restaurant={selectedPlace}
            formatDistance={formatDistance}
            onClose={() => setSelectedPlace(null)}
          />
        </div>
      )}

      {/* 바텀 시트 */}
      <div
        ref={sheetRef}
        className="absolute bottom-0 left-0 right-0 z-20 bg-white rounded-t-3xl shadow-2xl transition-all duration-300 ease-out"
        style={{ height: getSheetHeight() }}
      >
        {/* 드래그 핸들 */}
        <div
          className="flex flex-col items-center pt-3 pb-2 cursor-pointer"
          onClick={toggleSheet}
        >
          <div className="w-10 h-1 bg-gray-300 rounded-full mb-2" />
          <div className="flex items-center gap-1 text-xs text-gray-500">
            {sheetState === "full" ? (
              <><ChevronDown className="h-3 w-3" /> 지도 보기</>
            ) : (
              <><ChevronUp className="h-3 w-3" /> {nearbyRestaurants.length}개 음식점</>
            )}
          </div>
        </div>

        {/* 정렬 버튼 */}
        <div className="px-4 pb-2 flex gap-2 border-b border-gray-100">
          {[
            { key: "distance", label: "거리순" },
            { key: "rating", label: "별점순" },
            { key: "reviews", label: "리뷰순" }
          ].map(({ key, label }) => (
            <button
              key={key}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                sortType === key
                  ? "bg-orange-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
              onClick={() => setSortType(key as SortType)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 음식점 목록 */}
        <div className="overflow-y-auto" style={{ height: "calc(100% - 80px)" }}>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
            </div>
          ) : sortedRestaurants.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {sortedRestaurants.map((restaurant) => (
                <RestaurantListItem
                  key={restaurant.kakaoPlace.id}
                  restaurant={restaurant}
                  formatDistance={formatDistance}
                  onSelect={() => {
                    setSelectedPlace(restaurant)
                    setSheetState("collapsed")
                    const kakao = (window as any).kakao
                    if (kakao && mapInstanceRef.current) {
                      const pos = new kakao.maps.LatLng(
                        parseFloat(restaurant.kakaoPlace.y),
                        parseFloat(restaurant.kakaoPlace.x)
                      )
                      mapInstanceRef.current.panTo(pos)
                    }
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <MapPin className="h-10 w-10 mb-2" />
              <p className="text-sm">주변에 음식점이 없어요</p>
            </div>
          )}
        </div>
      </div>

      {/* 하단 네비게이션 */}
      <BottomNav />
    </div>
  )
}

// 선택된 음식점 카드
function SelectedPlaceCard({
  restaurant,
  formatDistance,
  onClose
}: {
  restaurant: NearbyRestaurant
  formatDistance: (d: string) => string
  onClose: () => void
}) {
  const { kakaoPlace, dbRestaurant } = restaurant
  const hasReview = dbRestaurant && dbRestaurant.reviewCount > 0
  const isFirstReview = dbRestaurant?.reviewCount === 0

  return (
    <div className="bg-white rounded-2xl shadow-xl p-4 border border-gray-100">
      <button
        onClick={onClose}
        className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100"
      >
        <X className="h-4 w-4 text-gray-400" />
      </button>

      <Link href={dbRestaurant ? `/restaurant/${dbRestaurant.id}` : '#'}>
        <div className="flex gap-3">
          {dbRestaurant?.thumbnail && (
            <div className="relative h-20 w-20 rounded-xl overflow-hidden bg-gray-100 shrink-0">
              <Image
                src={dbRestaurant.thumbnail}
                alt={kakaoPlace.name}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-lg mb-1">{kakaoPlace.name}</h3>

            <div className="flex items-center gap-2 mb-2">
              {hasReview ? (
                <>
                  <div className="flex items-center gap-1 bg-orange-50 px-2 py-0.5 rounded-full">
                    <Star className="h-3.5 w-3.5 fill-orange-500 text-orange-500" />
                    <span className="text-sm font-semibold text-orange-600">{dbRestaurant.averageRating}</span>
                  </div>
                  <span className="text-sm text-gray-500">리뷰 {dbRestaurant.reviewCount}</span>
                </>
              ) : isFirstReview ? (
                <Badge className="bg-violet-500 text-white text-xs gap-1">
                  <Sparkles className="h-3 w-3" />첫 리뷰 2배 포인트!
                </Badge>
              ) : (
                <span className="text-sm text-gray-400">리뷰 없음</span>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>{formatDistance(kakaoPlace.distance)}</span>
              <span>·</span>
              <span className="truncate">{kakaoPlace.roadAddress || kakaoPlace.address}</span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  )
}

// 음식점 리스트 아이템
function RestaurantListItem({
  restaurant,
  formatDistance,
  onSelect
}: {
  restaurant: NearbyRestaurant
  formatDistance: (d: string) => string
  onSelect: () => void
}) {
  const { kakaoPlace, dbRestaurant } = restaurant
  const hasReview = dbRestaurant && dbRestaurant.reviewCount > 0
  const isFirstReview = dbRestaurant?.reviewCount === 0

  const getCategoryDisplay = (category: string) => {
    const parts = category.split(' > ')
    return parts[parts.length - 1] || category
  }

  return (
    <button
      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
      onClick={onSelect}
    >
      {dbRestaurant?.thumbnail ? (
        <div className="relative h-14 w-14 rounded-xl overflow-hidden bg-gray-100 shrink-0">
          <Image
            src={dbRestaurant.thumbnail}
            alt={kakaoPlace.name}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      ) : (
        <div className="h-14 w-14 rounded-xl bg-gray-100 shrink-0 flex items-center justify-center">
          <MapPin className="h-5 w-5 text-gray-300" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-semibold text-gray-900 truncate">{kakaoPlace.name}</span>
          {isFirstReview && (
            <span className="shrink-0 px-1.5 py-0.5 bg-violet-100 text-violet-600 text-[10px] font-bold rounded">
              2배
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          {hasReview && (
            <>
              <Star className="h-3.5 w-3.5 fill-orange-500 text-orange-500" />
              <span className="font-medium text-gray-900">{dbRestaurant.averageRating}</span>
              <span className="text-gray-400">({dbRestaurant.reviewCount})</span>
              <span className="text-gray-300">·</span>
            </>
          )}
          <span className="text-gray-500">{getCategoryDisplay(kakaoPlace.category)}</span>
        </div>
      </div>

      <div className="shrink-0 text-right">
        <span className="text-sm font-medium text-orange-500">{formatDistance(kakaoPlace.distance)}</span>
      </div>
    </button>
  )
}

// 하단 네비게이션 (MobileLayout과 동일)
function BottomNav() {
  const navItems = [
    { href: "/", icon: Home, label: "홈" },
    { href: "/search", icon: Search, label: "검색", active: true },
    { href: "/write", icon: PenSquare, label: "리뷰작성" },
    { href: "/playlists", icon: ListMusic, label: "리스트" },
    { href: "/profile", icon: User, label: "내정보" },
  ]

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40 bg-card border-t border-border">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors",
                item.active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
