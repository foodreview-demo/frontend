"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import Script from "next/script"
import { Search, MapPin, Loader2, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export interface KakaoPlace {
  id: string
  name: string
  category: string
  categoryCode: string
  phone: string
  address: string
  roadAddress: string
  x: string // longitude
  y: string // latitude
  placeUrl: string
  distance?: string
}

interface KakaoMapSearchProps {
  onSelectPlace: (place: KakaoPlace) => void
  selectedPlace?: KakaoPlace | null
  onClear?: () => void
  className?: string
}

// 카카오맵 API 키 (환경변수에서 가져옴)
const KAKAO_MAP_API_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY

export function KakaoMapSearch({
  onSelectPlace,
  selectedPlace,
  onClear,
  className
}: KakaoMapSearchProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const placesServiceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])

  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<KakaoPlace[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [isScriptLoaded, setIsScriptLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 지도 초기화 함수
  const initializeMap = useCallback(() => {
    console.log("initializeMap 호출됨")
    console.log("mapRef.current:", mapRef.current)

    if (!mapRef.current) {
      console.error("mapRef.current가 없습니다")
      return
    }

    const kakao = (window as any).kakao
    console.log("kakao 객체:", kakao)
    console.log("kakao.maps:", kakao?.maps)
    console.log("kakao.maps.services:", kakao?.maps?.services)

    if (!kakao || !kakao.maps) {
      console.error("kakao.maps가 없습니다")
      return
    }

    try {
      // 기본 위치 (서울 시청)
      const defaultPosition = new kakao.maps.LatLng(37.5665, 126.9780)
      console.log("defaultPosition 생성됨:", defaultPosition)

      const mapInstance = new kakao.maps.Map(mapRef.current, {
        center: defaultPosition,
        level: 5
      })
      console.log("mapInstance 생성됨:", mapInstance)

      const placesService = new kakao.maps.services.Places()
      console.log("placesService 생성됨:", placesService)

      mapInstanceRef.current = mapInstance
      placesServiceRef.current = placesService
      setIsMapLoaded(true)
      setError(null)
      console.log("지도 초기화 완료!")

      // 현재 위치 가져오기
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const currentPos = new kakao.maps.LatLng(
              position.coords.latitude,
              position.coords.longitude
            )
            mapInstance.setCenter(currentPos)
          },
          () => {
            // 위치 권한 거부 시 기본 위치 사용
          }
        )
      }
    } catch (err) {
      console.error("지도 초기화 오류:", err)
      setError("지도를 초기화하는데 실패했습니다")
    }
  }, [])

  // 스크립트 로드 후 지도 초기화
  useEffect(() => {
    const kakao = (window as any).kakao

    // 이미 스크립트가 로드된 경우 (페이지 이동 후 돌아온 경우)
    if (kakao && kakao.maps) {
      if (kakao.maps.services) {
        // 이미 완전히 로드됨
        initializeMap()
      } else {
        // 스크립트는 있지만 services가 아직 안 로드됨
        kakao.maps.load(() => {
          initializeMap()
        })
      }
      setIsScriptLoaded(true)
    } else if (isScriptLoaded) {
      // 새로 스크립트 로드된 경우
      const newKakao = (window as any).kakao
      if (newKakao && newKakao.maps) {
        newKakao.maps.load(() => {
          initializeMap()
        })
      }
    }
  }, [isScriptLoaded, initializeMap])

  // Script 로드 핸들러
  const handleScriptLoad = () => {
    console.log("카카오맵 스크립트 로드 완료")
    setIsScriptLoaded(true)
  }

  const handleScriptError = (e: any) => {
    console.error("카카오맵 스크립트 로드 실패:", e)
    console.error("API Key:", KAKAO_MAP_API_KEY)
    console.error("Script URL:", `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_API_KEY}&libraries=services&autoload=false`)
    setError("카카오맵을 불러오는데 실패했습니다. API 키와 도메인 설정을 확인해주세요.")
  }

  // 마커 초기화
  const clearMarkers = useCallback(() => {
    markersRef.current.forEach(marker => marker.setMap(null))
    markersRef.current = []
  }, [])

  // 장소 검색
  const searchPlaces = useCallback(() => {
    const places = placesServiceRef.current
    const map = mapInstanceRef.current
    const kakao = (window as any).kakao

    if (!places || !searchQuery.trim() || !kakao) return

    setIsLoading(true)
    clearMarkers()

    // 음식점 카테고리로 검색 (FD6: 음식점)
    places.keywordSearch(
      searchQuery,
      (results: any[], status: string) => {
        setIsLoading(false)

        if (status === kakao.maps.services.Status.OK) {
          const placeResults: KakaoPlace[] = results.map((result: any) => ({
            id: result.id,
            name: result.place_name,
            category: result.category_name,
            categoryCode: result.category_group_code,
            phone: result.phone,
            address: result.address_name,
            roadAddress: result.road_address_name,
            x: result.x,
            y: result.y,
            placeUrl: result.place_url,
            distance: result.distance
          }))

          setSearchResults(placeResults)

          // 마커 생성
          if (map) {
            const newMarkers: any[] = []
            const bounds = new kakao.maps.LatLngBounds()

            placeResults.forEach((place) => {
              const position = new kakao.maps.LatLng(
                parseFloat(place.y),
                parseFloat(place.x)
              )

              const marker = new kakao.maps.Marker({
                position,
                map
              })

              newMarkers.push(marker)
              bounds.extend(position)

              // 마커 클릭 이벤트
              kakao.maps.event.addListener(marker, 'click', () => {
                onSelectPlace(place)
              })
            })

            markersRef.current = newMarkers

            if (placeResults.length > 0) {
              map.setBounds(bounds)
            }
          }
        } else if (status === kakao.maps.services.Status.ZERO_RESULT) {
          setSearchResults([])
        } else {
          console.error("검색 오류:", status)
          setSearchResults([])
        }
      },
      {
        size: 15
      }
    )
  }, [searchQuery, clearMarkers, onSelectPlace])

  // 선택된 장소로 지도 이동
  useEffect(() => {
    const map = mapInstanceRef.current
    const kakao = (window as any).kakao

    if (selectedPlace && map && kakao) {
      const position = new kakao.maps.LatLng(
        parseFloat(selectedPlace.y),
        parseFloat(selectedPlace.x)
      )
      map.setCenter(position)
      map.setLevel(3)

      // 선택된 장소에 마커 표시
      clearMarkers()
      const marker = new kakao.maps.Marker({
        position,
        map
      })
      markersRef.current = [marker]
    }
  }, [selectedPlace, clearMarkers])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    searchPlaces()
  }

  const getCategoryDisplay = (category: string): string => {
    const parts = category.split(' > ')
    return parts[parts.length - 1] || category
  }

  if (!KAKAO_MAP_API_KEY) {
    return (
      <Card className={cn("p-4", className)}>
        <div className="text-center text-muted-foreground">
          <MapPin className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
          <p className="text-sm">카카오맵 API 키가 설정되지 않았습니다</p>
          <p className="text-xs mt-1">환경변수에 NEXT_PUBLIC_KAKAO_MAP_API_KEY를 설정해주세요</p>
        </div>
      </Card>
    )
  }

  return (
    <>
      <Script
        src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_API_KEY}&libraries=services&autoload=false`}
        strategy="afterInteractive"
        onLoad={handleScriptLoad}
        onError={handleScriptError}
      />
    <div className={cn("space-y-3", className)}>
      {/* 검색 입력 */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="음식점 이름이나 주소로 검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button type="submit" disabled={isLoading || !isMapLoaded}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "검색"}
        </Button>
      </form>

      {/* 에러 표시 */}
      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}

      {/* 선택된 장소 표시 */}
      {selectedPlace && (
        <Card className="p-3 border-primary bg-primary/5">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-foreground">{selectedPlace.name}</h4>
                <Badge variant="outline" className="text-xs">
                  {getCategoryDisplay(selectedPlace.category)}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {selectedPlace.roadAddress || selectedPlace.address}
              </p>
              {selectedPlace.phone && (
                <p className="text-xs text-muted-foreground">{selectedPlace.phone}</p>
              )}
            </div>
            {onClear && (
              <Button variant="ghost" size="icon" onClick={onClear} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* 지도 */}
      <div className="relative w-full h-48 rounded-lg overflow-hidden bg-muted">
        <div ref={mapRef} className="w-full h-full" />
        {!isMapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {/* 검색 결과 목록 */}
      {searchResults.length > 0 && !selectedPlace && (
        <div className="max-h-60 overflow-y-auto rounded-lg border border-border divide-y divide-border">
          {searchResults.map((place) => (
            <button
              key={place.id}
              className="w-full p-3 text-left hover:bg-secondary/50 transition-colors"
              onClick={() => {
                onSelectPlace(place)
                setSearchResults([])
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground truncate">{place.name}</span>
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {getCategoryDisplay(place.category)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {place.roadAddress || place.address}
                  </p>
                </div>
                {place.distance && (
                  <span className="text-xs text-muted-foreground shrink-0 ml-2">
                    {parseInt(place.distance) > 1000
                      ? `${(parseInt(place.distance) / 1000).toFixed(1)}km`
                      : `${place.distance}m`
                    }
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* 검색 결과 없음 */}
      {searchResults.length === 0 && searchQuery && !isLoading && isMapLoaded && (
        <p className="text-sm text-muted-foreground text-center py-4">
          검색 결과가 없습니다
        </p>
      )}
    </div>
    </>
  )
}
