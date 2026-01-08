"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import Script from "next/script"
import { Search, Star, MapPin, Sparkles, Loader2, Navigation, X, ChevronUp, ChevronDown, Home, PenSquare, User, Users } from "lucide-react"
import { RequireAuth } from "@/components/require-auth"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { api, Restaurant } from "@/lib/api"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n-context"

const KAKAO_MAP_API_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY

// 하단 네비게이션 높이, 최소/최대 시트 높이 (px)
const BOTTOM_NAV_HEIGHT = 72
const MIN_SHEET_HEIGHT = 60
const MAX_SHEET_RATIO = 0.85

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

export default function SearchPage() {
  const t = useTranslation()
  const router = useRouter()
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const overlaysRef = useRef<any[]>([])
  const selectedOverlayRef = useRef<any>(null) // 선택된 마커 오버레이
  const placesServiceRef = useRef<any>(null)
  const geocoderRef = useRef<any>(null)
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
  const [sheetHeight, setSheetHeight] = useState(0) // px 단위
  const [isDragging, setIsDragging] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [isDbLoaded, setIsDbLoaded] = useState(false)
  const [showLocationPrompt, setShowLocationPrompt] = useState(false)
  const [locationPermissionChecked, setLocationPermissionChecked] = useState(false)

  // 초기 시트 높이 설정 (화면의 45%)
  useEffect(() => {
    const initialHeight = (window.innerHeight - BOTTOM_NAV_HEIGHT) * 0.45
    setSheetHeight(initialHeight)
  }, [])

  // DB에서 모든 음식점 가져오기
  useEffect(() => {
    const fetchDbRestaurants = async () => {
      try {
        const result = await api.getRestaurants(undefined, undefined, undefined, undefined, 0, 100)
        if (result.success) {
          setDbRestaurants(result.data.content)
        }
      } catch (err) {
        console.error("DB 음식점 로드 실패:", err)
      } finally {
        setIsDbLoaded(true)
      }
    }
    fetchDbRestaurants()
  }, [])

  // 현재 위치 마커 ref
  const currentLocationMarkerRef = useRef<any>(null)

  // 지도 보이는 영역의 중앙으로 마커 위치 설정 (바텀 시트 제외)
  const setCenterWithOffset = useCallback((lat: number, lng: number, currentSheetHeight?: number) => {
    const kakao = (window as any).kakao
    const map = mapInstanceRef.current
    if (!kakao || !map) return

    // 현재 바텀 시트 높이 (전달받은 값 또는 state 값 사용)
    const effectiveSheetHeight = currentSheetHeight ?? sheetHeight

    // 지도 영역 = 전체 화면 - 하단 네비게이션 - 바텀 시트
    const mapVisibleHeight = window.innerHeight - BOTTOM_NAV_HEIGHT - effectiveSheetHeight

    // 바텀 시트가 있으므로 마커를 지도 보이는 영역의 중앙으로 이동
    // 지도 보이는 영역의 중앙 = 화면 상단에서 (mapVisibleHeight / 2) 위치
    const projection = map.getProjection()
    const center = new kakao.maps.LatLng(lat, lng)
    const centerPoint = projection.pointFromCoords(center)

    // 오프셋 계산: 바텀 시트 높이의 절반만큼 위로 이동
    const offsetY = effectiveSheetHeight / 2
    const offsetPoint = new kakao.maps.Point(centerPoint.x, centerPoint.y + offsetY)
    const offsetCoords = projection.coordsFromPoint(offsetPoint)

    map.setCenter(offsetCoords)
  }, [sheetHeight])

  // 위치 마커 업데이트 함수
  const updateLocationMarker = useCallback((latitude: number, longitude: number) => {
    const kakao = (window as any).kakao
    const map = mapInstanceRef.current
    if (!kakao || !map) return

    const currentPos = new kakao.maps.LatLng(latitude, longitude)

    // 기존 위치 마커 제거
    if (currentLocationMarkerRef.current) {
      currentLocationMarkerRef.current.setMap(null)
    }

    // 현재 위치 마커 추가 (눈에 잘 띄는 펄스 애니메이션 마커)
    const marker = new kakao.maps.CustomOverlay({
      position: currentPos,
      content: `
        <div style="position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center;">
          <div style="position:absolute;width:40px;height:40px;background:rgba(59,130,246,0.2);border-radius:50%;animation:pulse 2s infinite;"></div>
          <div style="position:absolute;width:24px;height:24px;background:rgba(59,130,246,0.3);border-radius:50%;animation:pulse 2s infinite 0.3s;"></div>
          <div style="width:14px;height:14px;background:#3B82F6;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(59,130,246,0.5);z-index:1;"></div>
        </div>
        <style>
          @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            100% { transform: scale(2); opacity: 0; }
          }
        </style>
      `,
      yAnchor: 0.5,
      xAnchor: 0.5,
      zIndex: 100,
      map: map
    })
    currentLocationMarkerRef.current = marker
  }, [])

  // 현재 위치 가져오기 (2단계 전략: 빠른 저정밀 → 정확한 고정밀)
  const getCurrentLocation = useCallback(() => {
    return new Promise<{ lat: number; lng: number }>((resolve, reject) => {
      if (!navigator.geolocation) {
        setLocationError(t.search.locationNotSupported)
        reject(new Error("Geolocation not supported"))
        return
      }

      setLocationError(null)
      let resolved = false

      // 성공 핸들러
      const handleSuccess = (position: GeolocationPosition, isHighAccuracy: boolean) => {
        const { latitude, longitude } = position.coords

        // 이미 resolve된 경우 마커만 업데이트
        if (resolved) {
          // 고정밀 위치로 마커 업데이트
          setCurrentPosition({ lat: latitude, lng: longitude })
          updateLocationMarker(latitude, longitude)
          setCenterWithOffset(latitude, longitude)
          return
        }

        resolved = true
        setCurrentPosition({ lat: latitude, lng: longitude })
        updateLocationMarker(latitude, longitude)
        setCenterWithOffset(latitude, longitude)
        resolve({ lat: latitude, lng: longitude })

        // 저정밀로 먼저 성공한 경우, 백그라운드에서 고정밀 위치 획득 시도
        if (!isHighAccuracy) {
          navigator.geolocation.getCurrentPosition(
            (pos) => handleSuccess(pos, true),
            () => {}, // 고정밀 실패 시 무시 (이미 저정밀로 성공함)
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
          )
        }
      }

      // 에러 핸들러
      const handleError = (error: GeolocationPositionError) => {
        if (resolved) return // 이미 성공한 경우 무시

        console.error("위치 정보 오류:", error)
        let errorMessage = t.search.locationError
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = t.search.locationPermissionDenied
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = t.search.locationUnavailable
            break
          case error.TIMEOUT:
            errorMessage = t.search.locationTimeout
            break
        }
        setLocationError(errorMessage)
        reject(error)
      }

      // 1단계: 빠른 저정밀 위치 (캐시 활용, 셀 타워/WiFi 기반)
      navigator.geolocation.getCurrentPosition(
        (pos) => handleSuccess(pos, false),
        (error) => {
          // 저정밀 실패 시 고정밀로 재시도
          if (error.code === error.TIMEOUT) {
            navigator.geolocation.getCurrentPosition(
              (pos) => handleSuccess(pos, true),
              handleError,
              { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            )
          } else {
            handleError(error)
          }
        },
        {
          enableHighAccuracy: false, // 저정밀 = 빠름
          timeout: 5000, // 5초 타임아웃
          maximumAge: 300000 // 5분 캐시 허용
        }
      )
    })
  }, [setCenterWithOffset, updateLocationMarker, t.search.locationNotSupported, t.search.locationError, t.search.locationPermissionDenied, t.search.locationUnavailable, t.search.locationTimeout])

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
      const geocoder = new kakao.maps.services.Geocoder()

      mapInstanceRef.current = mapInstance
      placesServiceRef.current = placesService
      geocoderRef.current = geocoder
      setIsMapLoaded(true)
    } catch (err) {
      console.error("지도 초기화 오류:", err)
      setIsLoading(false)
    }
  }, [])

  // 카카오맵 스크립트 로드 후 지도 초기화
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

  // 주변 음식점 검색 (내 주변)
  const searchNearbyPlaces = useCallback((lat: number, lng: number) => {
    const places = placesServiceRef.current
    const kakao = (window as any).kakao
    if (!places || !kakao) return

    setIsLoading(true)
    const location = new kakao.maps.LatLng(lat, lng)

    places.categorySearch('FD6', async (results: any[], status: string) => {
      if (status === kakao.maps.services.Status.OK) {
        // 각 결과에 대해 좌표로 지번 주소 조회
        const kakaoPlaces: KakaoPlace[] = await Promise.all(
          results.map(async (r: any) => {
            const jibunAddress = await getJibunAddress(r.x, r.y)
            return {
              id: r.id,
              name: r.place_name,
              category: r.category_name,
              phone: r.phone,
              address: jibunAddress || r.address_name,
              roadAddress: r.road_address_name,
              x: r.x,
              y: r.y,
              distance: r.distance || "0"
            }
          })
        )

        const matched: NearbyRestaurant[] = kakaoPlaces.map(kp => {
          // 이름이 정확히 일치해야 매칭 (같은 건물 다른 가게 구분)
          const dbMatch = dbRestaurants.find(db => db.name === kp.name)
          return { kakaoPlace: kp, dbRestaurant: dbMatch }
        })

        setNearbyRestaurants(matched)
        displayMarkers(matched)
        setIsLoading(false)
      } else {
        setNearbyRestaurants([])
        setIsLoading(false)
      }
    }, {
      location,
      radius: 1000,
      size: 15,
      sort: kakao.maps.services.SortBy.DISTANCE
    })
  }, [dbRestaurants, getJibunAddress])

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

    places.keywordSearch(keyword, async (results: any[], status: string) => {
      if (status === kakao.maps.services.Status.OK) {
        // 각 결과에 대해 좌표로 지번 주소 조회
        const kakaoPlaces: KakaoPlace[] = await Promise.all(
          results.map(async (r: any) => {
            const jibunAddress = await getJibunAddress(r.x, r.y)
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
              address: jibunAddress || r.address_name,
              roadAddress: r.road_address_name,
              x: r.x,
              y: r.y,
              distance
            }
          })
        )

        const matched: NearbyRestaurant[] = kakaoPlaces.map(kp => {
          // 이름이 정확히 일치해야 매칭 (같은 건물 다른 가게 구분)
          const dbMatch = dbRestaurants.find(db => db.name === kp.name)
          return { kakaoPlace: kp, dbRestaurant: dbMatch }
        })

        setNearbyRestaurants(matched)
        displayMarkers(matched)
        setIsLoading(false)

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
        setIsLoading(false)
      }
    }, {
      size: 15
    })
  }, [dbRestaurants, currentPosition, getJibunAddress])

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
        labelText = t.search.firstReview
      }

      const content = document.createElement('div')
      content.className = 'map-marker'
      content.innerHTML = `
        <div style="
          cursor:pointer;
          display:flex;
          flex-direction:column;
          align-items:center;
          transition:transform 0.15s ease;
        " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
          <div style="
            background:${bgColor};
            color:white;
            padding:4px 8px;
            border-radius:12px;
            font-size:11px;
            font-weight:600;
            white-space:nowrap;
            box-shadow:0 2px 8px rgba(0,0,0,0.25);
            margin-bottom:4px;
          ">${labelText}</div>
          <div style="
            width:12px;
            height:12px;
            background:${bgColor};
            border:2px solid white;
            border-radius:50%;
            box-shadow:0 2px 6px rgba(0,0,0,0.3);
          "></div>
          <div style="
            width:2px;
            height:8px;
            background:${bgColor};
            margin-top:-2px;
          "></div>
        </div>
      `
      const overlay = new kakao.maps.CustomOverlay({
        position,
        content,
        yAnchor: 1, // 마커 핀 하단이 정확한 위치
        map
      })

      content.onclick = () => {
        // 이미 선택된 마커를 다시 클릭하면 음식점 페이지로 이동 (DB에 있는 경우만)
        if (selectedOverlayRef.current === overlay) {
          if (dbRestaurant && dbRestaurant.uuid) {
            router.push(`/restaurant/${dbRestaurant.uuid}`)
          } else if (dbRestaurant && dbRestaurant.id) {
            // uuid가 없으면 id로 이동
            router.push(`/restaurant/${dbRestaurant.id}`)
          } else {
            // DB에 없는 음식점은 리뷰 작성 페이지로 이동
            const params = new URLSearchParams({
              kakaoPlaceId: kakaoPlace.id,
              name: kakaoPlace.name,
              address: kakaoPlace.address,
              jibunAddress: kakaoPlace.address,
              category: kakaoPlace.category,
              phone: kakaoPlace.phone || '',
              x: kakaoPlace.x,
              y: kakaoPlace.y,
            })
            router.push(`/write?${params.toString()}`)
          }
          return
        }

        setSelectedPlace(restaurant)
        setSheetHeight(MIN_SHEET_HEIGHT)

        // 다른 마커들 숨기고 선택된 마커만 표시
        overlaysRef.current.forEach(o => {
          if (o !== overlay) o.setMap(null)
        })
        selectedOverlayRef.current = overlay

        // 줌 레벨 설정 후 중심 이동
        map.setLevel(3)
        map.setCenter(position)
        // idle 이벤트로 지도 렌더링 완료 후 오프셋 적용
        kakao.maps.event.addListener(map, 'idle', function onIdle() {
          kakao.maps.event.removeListener(map, 'idle', onIdle)
          const projection = map.getProjection()
          const centerPoint = projection.pointFromCoords(position)
          const cardAndSheetHeight = MIN_SHEET_HEIGHT + 160
          const offsetY = cardAndSheetHeight / 2
          const offsetPoint = new kakao.maps.Point(centerPoint.x, centerPoint.y + offsetY)
          const offsetCoords = projection.coordsFromPoint(offsetPoint)
          map.setCenter(offsetCoords)
        })
      }

      overlaysRef.current.push(overlay)
    })
  }, [router])

  // 위치 권한 상태 확인
  const checkLocationPermission = useCallback(async () => {
    // 이전에 "다음에 하기"를 선택했는지 확인
    const locationSkipped = localStorage.getItem('locationPromptSkipped')
    if (locationSkipped === 'true') {
      setLocationPermissionChecked(true)
      setIsLoading(false)
      searchNearbyPlaces(37.5665, 126.9780) // 서울 중심으로 검색
      return
    }

    // permissions API 지원 여부 확인
    if (!navigator.permissions) {
      // permissions API가 없으면 바로 위치 요청
      setShowLocationPrompt(true)
      setLocationPermissionChecked(true)
      return
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' })

      if (permission.state === 'granted') {
        // 이미 허용됨 - 바로 위치 가져오기
        localStorage.removeItem('locationPromptSkipped') // 스킵 플래그 제거
        setLocationPermissionChecked(true)
        const pos = await getCurrentLocation()
        searchNearbyPlaces(pos.lat, pos.lng)
      } else if (permission.state === 'denied') {
        // 거부됨 - 안내 메시지 표시
        setLocationError(t.search.locationPermissionDenied)
        setLocationPermissionChecked(true)
        setIsLoading(false)
        searchNearbyPlaces(37.5665, 126.9780) // 서울 중심으로 검색
      } else {
        // prompt 상태 - 사용자에게 동의 UI 표시
        setShowLocationPrompt(true)
        setLocationPermissionChecked(true)
      }

      // 권한 상태 변경 감지
      permission.addEventListener('change', () => {
        if (permission.state === 'granted') {
          setShowLocationPrompt(false)
          setLocationError(null)
        } else if (permission.state === 'denied') {
          setShowLocationPrompt(false)
          setLocationError(t.search.locationPermissionDenied)
        }
      })
    } catch {
      // permissions API 실패 시 프롬프트 표시
      setShowLocationPrompt(true)
      setLocationPermissionChecked(true)
    }
  }, [getCurrentLocation, searchNearbyPlaces, t.search.locationPermissionDenied])

  // 사용자가 위치 공유 동의 버튼 클릭
  const handleLocationConsent = async () => {
    setShowLocationPrompt(false)
    setIsLoading(true)
    // 위치 공유 허용 시 스킵 플래그 제거
    localStorage.removeItem('locationPromptSkipped')
    try {
      const pos = await getCurrentLocation()
      searchNearbyPlaces(pos.lat, pos.lng)
    } catch {
      setIsLoading(false)
      searchNearbyPlaces(37.5665, 126.9780)
    }
  }

  // 사용자가 위치 공유 거부
  const handleLocationDeny = () => {
    setShowLocationPrompt(false)
    setIsLoading(false)
    // 사용자 선택 저장 (다시 묻지 않음)
    localStorage.setItem('locationPromptSkipped', 'true')
    searchNearbyPlaces(37.5665, 126.9780) // 서울 중심으로 검색
  }

  // 지도와 DB 모두 로드된 후 위치 권한 확인
  useEffect(() => {
    if (!isMapLoaded || !isDbLoaded || locationPermissionChecked) return

    checkLocationPermission()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMapLoaded, isDbLoaded, locationPermissionChecked])

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

  const moveToCurrentLocation = async () => {
    const kakao = (window as any).kakao
    const map = mapInstanceRef.current
    if (!kakao || !map) return

    setSearchQuery("") // 검색어 초기화
    setIsLoading(true)

    try {
      const pos = await getCurrentLocation()
      map.setLevel(4)
      // 바텀 시트를 고려하여 지도 중심 이동
      setCenterWithOffset(pos.lat, pos.lng)
      searchNearbyPlaces(pos.lat, pos.lng)
    } catch {
      // 실패 시 기존 위치 사용
      setIsLoading(false)
      if (currentPosition) {
        map.setLevel(4)
        setCenterWithOffset(currentPosition.lat, currentPosition.lng)
        searchNearbyPlaces(currentPosition.lat, currentPosition.lng)
      }
    }
  }

  const formatDistance = (distance: string) => {
    const d = parseInt(distance)
    return d >= 1000 ? `${(d / 1000).toFixed(1)}km` : `${d}m`
  }

  // 드래그 시작 위치 저장용 ref
  const dragStartY = useRef(0)
  const dragStartHeight = useRef(0)

  // 드래그 핸들러
  const handleDragStart = useCallback((clientY: number) => {
    setIsDragging(true)
    dragStartY.current = clientY
    dragStartHeight.current = sheetHeight
  }, [sheetHeight])

  const handleDragMove = useCallback((clientY: number) => {
    if (!isDragging) return

    const deltaY = dragStartY.current - clientY
    const maxHeight = (window.innerHeight - BOTTOM_NAV_HEIGHT) * MAX_SHEET_RATIO
    const newHeight = Math.max(MIN_SHEET_HEIGHT, Math.min(maxHeight, dragStartHeight.current + deltaY))

    setSheetHeight(newHeight)
  }, [isDragging])

  const handleDragEnd = useCallback(() => {
    setIsDragging(false)

    // 스냅 포인트로 이동 (최소, 중간, 최대)
    const maxHeight = (window.innerHeight - BOTTOM_NAV_HEIGHT) * MAX_SHEET_RATIO
    const midHeight = (window.innerHeight - BOTTOM_NAV_HEIGHT) * 0.45

    if (sheetHeight < MIN_SHEET_HEIGHT + 50) {
      setSheetHeight(MIN_SHEET_HEIGHT)
    } else if (sheetHeight < (midHeight + MIN_SHEET_HEIGHT) / 2) {
      setSheetHeight(MIN_SHEET_HEIGHT)
    } else if (sheetHeight < (maxHeight + midHeight) / 2) {
      setSheetHeight(midHeight)
    } else {
      setSheetHeight(maxHeight)
    }
  }, [sheetHeight])

  // 터치/마우스 이벤트 핸들러
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    handleDragStart(e.touches[0].clientY)
  }, [handleDragStart])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    handleDragMove(e.touches[0].clientY)
  }, [handleDragMove])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    handleDragStart(e.clientY)
  }, [handleDragStart])

  // 전역 마우스 이벤트 (드래그 중)
  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      handleDragMove(e.clientY)
    }

    const handleMouseUp = () => {
      handleDragEnd()
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('touchmove', (e) => handleDragMove(e.touches[0].clientY))
    window.addEventListener('touchend', handleDragEnd)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, handleDragMove, handleDragEnd])

  // 토글 (탭 시)
  const toggleSheet = () => {
    const maxHeight = (window.innerHeight - BOTTOM_NAV_HEIGHT) * MAX_SHEET_RATIO
    const midHeight = (window.innerHeight - BOTTOM_NAV_HEIGHT) * 0.45

    if (sheetHeight <= MIN_SHEET_HEIGHT + 10) {
      setSheetHeight(midHeight)
    } else if (sheetHeight < maxHeight - 10) {
      setSheetHeight(maxHeight)
    } else {
      setSheetHeight(midHeight)
    }
  }

  // 시트가 최소/최대 상태인지 확인
  const isSheetCollapsed = sheetHeight <= MIN_SHEET_HEIGHT + 10
  const [windowHeight, setWindowHeight] = useState(0)

  useEffect(() => {
    setWindowHeight(window.innerHeight)
    const handleResize = () => setWindowHeight(window.innerHeight)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isSheetFull = windowHeight > 0 && sheetHeight >= (windowHeight - BOTTOM_NAV_HEIGHT) * MAX_SHEET_RATIO - 10

  const content = (
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
                placeholder={t.search.placeholder}
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

      {/* 위치 공유 동의 프롬프트 */}
      {showLocationPrompt && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="mx-4 bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <Navigation className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{t.search.locationPermissionTitle}</h3>
              <p className="text-sm text-gray-600 mb-6 whitespace-pre-line">
                {t.search.locationPermissionDesc}
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={handleLocationDeny}
                  className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  {t.search.later}
                </button>
                <button
                  onClick={handleLocationConsent}
                  className="flex-1 py-3 px-4 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors"
                >
                  {t.search.shareLocation}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 위치 에러 메시지 */}
      {locationError && (
        <div className="absolute top-16 left-3 right-3 z-30">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center justify-between">
            <span>{locationError}</span>
            <button onClick={() => setLocationError(null)} className="ml-2 text-red-500 hover:text-red-700">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* 선택된 음식점 카드 */}
      {selectedPlace && (
        <div className="absolute left-3 right-3 z-30 animate-in slide-in-from-bottom-4 duration-200" style={{ bottom: "calc(72px + 70px)" }}>
          <SelectedPlaceCard
            restaurant={selectedPlace}
            formatDistance={formatDistance}
            onClose={() => {
              setSelectedPlace(null)
              selectedOverlayRef.current = null
              // 숨겨진 마커들 다시 표시
              const map = mapInstanceRef.current
              overlaysRef.current.forEach(o => o.setMap(map))
            }}
            t={t}
          />
        </div>
      )}

      {/* 바텀 시트 - 네비게이션 위에 위치 */}
      <div
        ref={sheetRef}
        className={cn(
          "absolute left-0 right-0 z-20 bg-white rounded-t-3xl shadow-2xl",
          isDragging ? "" : "transition-all duration-300 ease-out"
        )}
        style={{ height: `${sheetHeight}px`, bottom: `${BOTTOM_NAV_HEIGHT}px` }}
      >
        {/* 드래그 핸들 */}
        <div
          className="flex flex-col items-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none select-none"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleDragEnd}
          onClick={(e) => {
            // 드래그가 아닌 경우에만 토글
            if (!isDragging && Math.abs(dragStartY.current - (e as any).clientY || 0) < 5) {
              toggleSheet()
            }
          }}
        >
          <div className="w-10 h-1 bg-gray-300 rounded-full mb-2" />
          <div className="flex items-center gap-1 text-xs text-gray-500">
            {isSheetFull ? (
              <><ChevronDown className="h-3 w-3" /> {t.search.showMap}</>
            ) : (
              <><ChevronUp className="h-3 w-3" /> {nearbyRestaurants.length}{t.search.restaurants}</>
            )}
          </div>
        </div>

        {/* 정렬 버튼 */}
        <div className="px-4 pb-2 flex gap-2 border-b border-gray-100">
          {[
            { key: "distance", label: t.search.sortDistance },
            { key: "rating", label: t.search.sortRating },
            { key: "reviews", label: t.search.sortReviews }
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
        <div className="overflow-y-auto pb-4" style={{ height: "calc(100% - 70px)" }}>
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
                    setSheetHeight(MIN_SHEET_HEIGHT)
                    const kakao = (window as any).kakao
                    const map = mapInstanceRef.current
                    if (kakao && map) {
                      const pos = new kakao.maps.LatLng(
                        parseFloat(restaurant.kakaoPlace.y),
                        parseFloat(restaurant.kakaoPlace.x)
                      )
                      // 줌 레벨 설정 후 중심 이동
                      map.setLevel(3)
                      map.setCenter(pos)
                      // idle 이벤트로 지도 렌더링 완료 후 오프셋 적용
                      kakao.maps.event.addListener(map, 'idle', function onIdle() {
                        kakao.maps.event.removeListener(map, 'idle', onIdle)
                        const projection = map.getProjection()
                        const centerPoint = projection.pointFromCoords(pos)
                        const cardAndSheetHeight = MIN_SHEET_HEIGHT + 160
                        const offsetY = cardAndSheetHeight / 2
                        const offsetPoint = new kakao.maps.Point(centerPoint.x, centerPoint.y + offsetY)
                        const offsetCoords = projection.coordsFromPoint(offsetPoint)
                        map.setCenter(offsetCoords)
                      })
                    }
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <MapPin className="h-10 w-10 mb-2" />
              <p className="text-sm">{t.search.noRestaurantsNearby}</p>
            </div>
          )}
        </div>
      </div>

      {/* 하단 네비게이션 */}
      <BottomNav />
    </div>
  )

  return <RequireAuth>{content}</RequireAuth>
}

// 선택된 음식점 카드
function SelectedPlaceCard({
  restaurant,
  formatDistance,
  onClose,
  t
}: {
  restaurant: NearbyRestaurant
  formatDistance: (d: string) => string
  onClose: () => void
  t: ReturnType<typeof useTranslation>
}) {
  const { kakaoPlace, dbRestaurant } = restaurant
  const hasReview = dbRestaurant && dbRestaurant.reviewCount > 0
  const isFirstReview = dbRestaurant?.reviewCount === 0
  const isNewRestaurant = !dbRestaurant // DB에 없는 음식점

  // 리뷰 작성 페이지로 이동할 URL 생성 (카카오 장소 정보를 쿼리로 전달)
  const getWriteReviewUrl = () => {
    if (dbRestaurant) {
      return `/write?restaurantId=${dbRestaurant.id}`
    }
    // DB에 없는 음식점: 카카오 장소 정보를 쿼리 파라미터로 전달
    // 지번 주소(구주소)를 기본 주소로 사용 (시/구/동 파싱에 용이)
    const params = new URLSearchParams({
      kakaoPlaceId: kakaoPlace.id,
      name: kakaoPlace.name,
      address: kakaoPlace.address, // 지번 주소(구주소) 사용
      jibunAddress: kakaoPlace.address, // 지번 주소 (지역 파싱용)
      category: kakaoPlace.category,
      phone: kakaoPlace.phone || '',
      x: kakaoPlace.x,
      y: kakaoPlace.y,
    })
    return `/write?${params.toString()}`
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-4 border border-gray-100 relative">
      <button
        onClick={onClose}
        className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100 z-10"
      >
        <X className="h-4 w-4 text-gray-400" />
      </button>

      <div className="flex gap-3">
        {dbRestaurant?.thumbnail ? (
          <div className="relative h-20 w-20 rounded-xl overflow-hidden bg-gray-100 shrink-0">
            <Image
              src={dbRestaurant.thumbnail}
              alt={kakaoPlace.name}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        ) : (
          <div className="h-20 w-20 rounded-xl bg-gradient-to-br from-orange-100 to-orange-50 shrink-0 flex items-center justify-center">
            <MapPin className="h-8 w-8 text-orange-300" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 text-lg mb-1 pr-8">{kakaoPlace.name}</h3>

          <div className="flex items-center gap-2 mb-2">
            {hasReview ? (
              <>
                <div className="flex items-center gap-1 bg-orange-50 px-2 py-0.5 rounded-full">
                  <Star className="h-3.5 w-3.5 fill-orange-500 text-orange-500" />
                  <span className="text-sm font-semibold text-orange-600">{dbRestaurant.averageRating}</span>
                </div>
                <span className="text-sm text-gray-500">{t.profile.reviews} {dbRestaurant.reviewCount}</span>
              </>
            ) : isFirstReview || isNewRestaurant ? (
              <Badge className="bg-violet-500 text-white text-xs gap-1">
                <Sparkles className="h-3 w-3" />{t.search.firstReviewBadge}
              </Badge>
            ) : (
              <span className="text-sm text-gray-400">{t.search.noReview}</span>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>{formatDistance(kakaoPlace.distance)}</span>
            <span>·</span>
            <span className="truncate">{kakaoPlace.address}</span>
          </div>
        </div>
      </div>

      {/* 하단 버튼 영역 */}
      <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
        {dbRestaurant ? (
          <>
            <Link href={`/restaurant/${dbRestaurant.uuid}`} className="flex-1">
              <button className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors">
                {t.search.viewDetails}
              </button>
            </Link>
            <Link href={getWriteReviewUrl()} className="flex-1">
              <button className="w-full py-2 px-4 bg-orange-500 text-white rounded-xl text-sm font-medium hover:bg-orange-600 transition-colors">
                {t.search.writeReview}
              </button>
            </Link>
          </>
        ) : (
          <Link href={getWriteReviewUrl()} className="flex-1">
            <button className="w-full py-2.5 px-4 bg-gradient-to-r from-violet-500 to-orange-500 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
              <Sparkles className="h-4 w-4" />
              {t.search.firstReviewBonus}
            </button>
          </Link>
        )}
      </div>
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
  const t = useTranslation()
  const navItems = [
    { href: "/", icon: Home, label: t.nav.home },
    { href: "/search", icon: Search, label: t.nav.search, active: true },
    { href: "/write", icon: PenSquare, label: t.nav.write },
    { href: "/follows", icon: Users, label: t.nav.friends },
    { href: "/profile", icon: User, label: t.nav.profile },
  ]

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40 bg-card border-t border-border h-[72px]">
      <div className="flex items-center justify-around h-full">
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
