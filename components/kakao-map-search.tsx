"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import Script from "next/script"
import { Search, MapPin, Loader2, X, Navigation, Sparkles, AlertCircle } from "lucide-react"
import { Capacitor } from "@capacitor/core"
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
  // 지역 정보 (선택된 장소가 있을 때 표시)
  region?: string
  district?: string
  neighborhood?: string
  onRegionChange?: (region: string, district: string, neighborhood: string) => void
  regionSelector?: React.ReactNode
}

// 카카오맵 API 키 (환경변수에서 가져옴)
const KAKAO_MAP_API_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY

export function KakaoMapSearch({
  onSelectPlace,
  selectedPlace,
  onClear,
  className,
  region,
  district,
  neighborhood,
  regionSelector
}: KakaoMapSearchProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const placesServiceRef = useRef<any>(null)
  const geocoderRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const infoWindowRef = useRef<any>(null)
  const nearbyMarkersRef = useRef<any[]>([]) // 주변 음식점 마커

  const [searchQuery, setSearchQuery] = useState("")
  const [nearbyPlaces, setNearbyPlaces] = useState<KakaoPlace[]>([]) // 지도에 표시된 주변 음식점
  const [searchResults, setSearchResults] = useState<KakaoPlace[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [isScriptLoaded, setIsScriptLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLocating, setIsLocating] = useState(false)

  // 지도 초기화 함수
  const initializeMap = useCallback(() => {
    if (!mapRef.current) return

    const kakao = (window as any).kakao
    if (!kakao || !kakao.maps) return

    try {
      // 기본 위치 (서울 시청)
      const defaultPosition = new kakao.maps.LatLng(37.5665, 126.9780)

      const mapInstance = new kakao.maps.Map(mapRef.current, {
        center: defaultPosition,
        level: 5,
        draggable: true,
        scrollwheel: true,
        disableDoubleClickZoom: false,
      })

      const placesService = new kakao.maps.services.Places()
      const geocoder = new kakao.maps.services.Geocoder()

      mapInstanceRef.current = mapInstance
      placesServiceRef.current = placesService
      geocoderRef.current = geocoder
      setIsMapLoaded(true)
      setError(null)

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
      console.error("지도 초기화 실패:", err)
      setError("지도를 초기화하는데 실패했습니다")
    }
  }, [])

  // Capacitor 앱에서 스크립트 로드 상태 모니터링
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const checkKakaoLoaded = setTimeout(() => {
        const kakao = (window as any).kakao
        if (!kakao || !kakao.maps) {
          console.warn("카카오맵 SDK가 로드되지 않음 (5초 경과)")
          if (!isMapLoaded && !error) {
            setError("카카오맵 로드 중... 카카오 개발자 콘솔에서 'localhost' 도메인이 등록되어 있는지 확인해주세요.")
          }
        }
      }, 5000)
      return () => clearTimeout(checkKakaoLoaded)
    }
  }, [isMapLoaded, error])

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
    setIsScriptLoaded(true)
  }

  const handleScriptError = () => {
    const isNative = Capacitor.isNativePlatform()
    if (isNative) {
      setError("카카오맵을 불러올 수 없습니다. 카카오 개발자 콘솔에서 'localhost' 도메인을 등록해주세요.")
    } else {
      setError("카카오맵을 불러오는데 실패했습니다. API 키와 도메인 설정을 확인해주세요.")
    }
    console.error("카카오맵 스크립트 로드 실패", { isNative, apiKey: KAKAO_MAP_API_KEY ? "설정됨" : "미설정" })
  }

  // 마커 초기화
  const clearMarkers = useCallback(() => {
    markersRef.current.forEach(marker => marker.setMap(null))
    markersRef.current = []
    if (infoWindowRef.current) {
      infoWindowRef.current.close()
      infoWindowRef.current = null
    }
  }, [])

  // 특정 장소에 마커와 인포윈도우 표시
  const showPlaceOnMap = useCallback((place: KakaoPlace, shouldSelect: boolean = false) => {
    const map = mapInstanceRef.current
    const kakao = (window as any).kakao

    if (!map || !kakao) {
      return
    }

    const position = new kakao.maps.LatLng(
      parseFloat(place.y),
      parseFloat(place.x)
    )

    // 기존 마커/인포윈도우 제거
    markersRef.current.forEach(marker => marker.setMap(null))
    markersRef.current = []
    if (infoWindowRef.current) {
      infoWindowRef.current.close()
      infoWindowRef.current = null
    }

    // 지도 레이아웃 갱신 후 이동 (컨테이너 크기 변경 대응)
    map.relayout()

    // 줌 레벨 설정 후 중심 이동, idle 이벤트로 완료 확인
    map.setLevel(3)
    map.setCenter(position)

    // idle 이벤트로 지도 렌더링 완료 후 다시 중심 맞춤
    kakao.maps.event.addListener(map, 'idle', function onIdle() {
      kakao.maps.event.removeListener(map, 'idle', onIdle)
      map.setCenter(position)
    })

    // 새 마커 생성
    const marker = new kakao.maps.Marker({
      position,
      map
    })
    markersRef.current = [marker]

    // 인포윈도우 생성
    const infoContent = `
      <div style="padding:8px 12px;min-width:150px;font-size:13px;">
        <strong style="display:block;margin-bottom:4px;">${place.name}</strong>
        <span style="color:#666;font-size:11px;">${place.address}</span>
      </div>
    `
    const infoWindow = new kakao.maps.InfoWindow({
      content: infoContent,
      removable: true
    })
    infoWindow.open(map, marker)
    infoWindowRef.current = infoWindow

    // 선택 처리
    if (shouldSelect) {
      onSelectPlace(place)
    }
  }, [onSelectPlace])

  // 현재 위치로 이동
  const moveToCurrentLocation = useCallback(() => {
    const map = mapInstanceRef.current
    const kakao = (window as any).kakao

    if (!map || !kakao || !navigator.geolocation) return

    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const currentPos = new kakao.maps.LatLng(
          position.coords.latitude,
          position.coords.longitude
        )
        map.setCenter(currentPos)
        map.setLevel(4)
        setIsLocating(false)
      },
      (error) => {
        console.error("위치 정보를 가져올 수 없습니다:", error)
        setIsLocating(false)
        alert("위치 정보를 가져올 수 없습니다. 위치 권한을 확인해주세요.")
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [])

  // 좌표로 지번 주소 조회
  const getJibunAddress = useCallback((x: string, y: string): Promise<string> => {
    return new Promise((resolve) => {
      const geocoder = geocoderRef.current
      const kakao = (window as any).kakao

      if (!geocoder || !kakao) {
        resolve('')
        return
      }

      geocoder.coord2Address(parseFloat(x), parseFloat(y), (result: any[], status: string) => {
        if (status === kakao.maps.services.Status.OK && result[0]) {
          // 지번 주소 우선, 없으면 도로명 주소
          const address = result[0].address
          if (address) {
            resolve(address.address_name)
          } else if (result[0].road_address) {
            resolve(result[0].road_address.address_name)
          } else {
            resolve('')
          }
        } else {
          resolve('')
        }
      })
    })
  }, [])

  // 장소 검색
  const searchPlaces = useCallback(async () => {
    const places = placesServiceRef.current
    const map = mapInstanceRef.current
    const kakao = (window as any).kakao

    if (!places || !searchQuery.trim() || !kakao) return

    setIsLoading(true)
    clearMarkers()

    // 음식점 카테고리로 검색 (FD6: 음식점)
    places.keywordSearch(
      searchQuery,
      async (results: any[], status: string) => {
        if (status === kakao.maps.services.Status.OK) {
          // 각 결과에 대해 좌표로 지번 주소 조회
          const placeResults: KakaoPlace[] = await Promise.all(
            results.map(async (result: any) => {
              // 좌표로 지번 주소 조회
              const jibunAddress = await getJibunAddress(result.x, result.y)

              return {
                id: result.id,
                name: result.place_name,
                category: result.category_name,
                categoryCode: result.category_group_code,
                phone: result.phone,
                // 지번 주소 우선 사용 (coord2Address로 조회한 값 > 기존 address_name)
                address: jibunAddress || result.address_name,
                roadAddress: result.road_address_name,
                x: result.x,
                y: result.y,
                placeUrl: result.place_url,
                distance: result.distance
              }
            })
          )

          setSearchResults(placeResults)
          setIsLoading(false)

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

              // 마커 클릭 이벤트 - 인포윈도우 표시 후 선택
              kakao.maps.event.addListener(marker, 'click', () => {
                // 기존 인포윈도우 닫기
                if (infoWindowRef.current) {
                  infoWindowRef.current.close()
                }

                // 인포윈도우 생성 및 표시
                const infoContent = `
                  <div style="padding:8px 12px;min-width:150px;font-size:13px;">
                    <strong style="display:block;margin-bottom:4px;">${place.name}</strong>
                    <span style="color:#666;font-size:11px;">${place.address}</span>
                  </div>
                `
                const infoWindow = new kakao.maps.InfoWindow({
                  content: infoContent,
                  removable: true
                })
                infoWindow.open(map, marker)
                infoWindowRef.current = infoWindow

                // 줌 레벨 먼저 설정 후 중심 이동
                map.setLevel(3)
                map.setCenter(position)

                // 장소 선택
                onSelectPlace(place)
                setSearchResults([])
              })
            })

            markersRef.current = newMarkers

            if (placeResults.length > 0) {
              map.setBounds(bounds)
            }
          }
        } else if (status === kakao.maps.services.Status.ZERO_RESULT) {
          setSearchResults([])
          setIsLoading(false)
        } else {
          console.error("검색 오류:", status)
          setSearchResults([])
          setIsLoading(false)
        }
      },
      {
        size: 15
      }
    )
  }, [searchQuery, clearMarkers, onSelectPlace, getJibunAddress])

  // 선택된 장소로 지도 이동 (외부에서 selectedPlace가 변경된 경우)
  useEffect(() => {
    const map = mapInstanceRef.current
    const kakao = (window as any).kakao

    if (selectedPlace && map && kakao) {
      // 이미 마커가 있으면 스킵 (showPlaceOnMap에서 이미 처리됨)
      if (markersRef.current.length > 0) return

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

      // 인포윈도우 표시
      const infoContent = `
        <div style="padding:8px 12px;min-width:150px;font-size:13px;">
          <strong style="display:block;margin-bottom:4px;">${selectedPlace.name}</strong>
          <span style="color:#666;font-size:11px;">${selectedPlace.address}</span>
        </div>
      `
      const infoWindow = new kakao.maps.InfoWindow({
        content: infoContent,
        removable: true
      })
      infoWindow.open(map, marker)
      infoWindowRef.current = infoWindow
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

      {/* 지도 */}
      <div className="relative w-full h-64 rounded-lg overflow-hidden bg-muted">
        <div ref={mapRef} className="w-full h-full" />
        {!isMapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {/* 현재 위치 버튼 */}
        {isMapLoaded && (
          <Button
            variant="secondary"
            size="icon"
            className="absolute bottom-3 right-3 h-10 w-10 rounded-full shadow-lg bg-background/95 hover:bg-background"
            onClick={moveToCurrentLocation}
            disabled={isLocating}
          >
            {isLocating ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Navigation className="h-5 w-5" />
            )}
          </Button>
        )}
        {/* 지도 조작 안내 */}
        {isMapLoaded && !selectedPlace && searchResults.length === 0 && (
          <div className="absolute top-2 left-2 right-2">
            <div className="bg-background/80 backdrop-blur-sm text-xs text-muted-foreground px-2 py-1 rounded text-center">
              드래그하여 이동 · 휠로 확대/축소
            </div>
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
                showPlaceOnMap(place, true)
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
                    {place.address}
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
      {searchResults.length === 0 && searchQuery && !isLoading && isMapLoaded && !selectedPlace && (
        <p className="text-sm text-muted-foreground text-center py-4">
          검색 결과가 없습니다
        </p>
      )}

      {/* 선택된 장소 표시 */}
      {selectedPlace && (
        <Card className="p-3 border-primary bg-primary/5">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <h4 className="font-semibold text-foreground">{selectedPlace.name}</h4>
                <Badge variant="outline" className="text-xs">
                  {getCategoryDisplay(selectedPlace.category)}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {selectedPlace.address}
              </p>
              {selectedPlace.phone && (
                <p className="text-xs text-muted-foreground">{selectedPlace.phone}</p>
              )}
              <Badge className="mt-2 bg-primary text-primary-foreground text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                첫 리뷰 가능
              </Badge>
            </div>
            {onClear && (
              <Button variant="ghost" size="icon" onClick={onClear} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          {/* 지역 정보 */}
          {regionSelector && (
            <div className="mt-3 pt-3 border-t border-border">
              {regionSelector}
            </div>
          )}
        </Card>
      )}
    </div>
    </>
  )
}
