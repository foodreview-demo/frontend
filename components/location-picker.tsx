"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Script from "next/script"
import { MapPin, Navigation, Loader2, X, Check } from "lucide-react"
import { cn } from "@/lib/utils"

const KAKAO_MAP_API_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY

export interface SelectedLocation {
  latitude: number
  longitude: number
  address: string
  region: string        // 시/도
  district: string      // 구/군
  neighborhood: string  // 동/읍/면
}

interface LocationPickerProps {
  onSelect: (location: SelectedLocation) => void
  onClose: () => void
  initialPosition?: { lat: number; lng: number }
}

export function LocationPicker({ onSelect, onClose, initialPosition }: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const geocoderRef = useRef<any>(null)

  const [isScriptLoaded, setIsScriptLoaded] = useState(false)
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [selectedPosition, setSelectedPosition] = useState<{ lat: number; lng: number } | null>(null)
  const [addressInfo, setAddressInfo] = useState<{
    address: string
    region: string
    district: string
    neighborhood: string
  } | null>(null)
  const [isLoadingAddress, setIsLoadingAddress] = useState(false)

  // 지도 초기화
  const initializeMap = useCallback(() => {
    if (!mapRef.current) return
    const kakao = (window as any).kakao
    if (!kakao || !kakao.maps) return

    try {
      // 초기 위치 (서울 중심 또는 전달받은 위치)
      const defaultLat = initialPosition?.lat || 37.5665
      const defaultLng = initialPosition?.lng || 126.9780
      const defaultPosition = new kakao.maps.LatLng(defaultLat, defaultLng)

      const mapInstance = new kakao.maps.Map(mapRef.current, {
        center: defaultPosition,
        level: 4
      })
      const geocoder = new kakao.maps.services.Geocoder()

      mapInstanceRef.current = mapInstance
      geocoderRef.current = geocoder
      setIsMapLoaded(true)

      // 지도 클릭 이벤트 등록
      kakao.maps.event.addListener(mapInstance, 'click', (mouseEvent: any) => {
        const latlng = mouseEvent.latLng
        const lat = latlng.getLat()
        const lng = latlng.getLng()

        // 마커 업데이트
        updateMarker(lat, lng)
        setSelectedPosition({ lat, lng })

        // 좌표 → 주소 변환
        getAddressFromCoords(lat, lng)
      })
    } catch (err) {
      console.error("지도 초기화 오류:", err)
    }
  }, [initialPosition])

  // 마커 업데이트
  const updateMarker = useCallback((lat: number, lng: number) => {
    const kakao = (window as any).kakao
    const map = mapInstanceRef.current
    if (!kakao || !map) return

    const position = new kakao.maps.LatLng(lat, lng)

    // 기존 마커 제거
    if (markerRef.current) {
      markerRef.current.setMap(null)
    }

    // 새 마커 생성 (커스텀 오버레이로 예쁜 핀)
    const content = document.createElement('div')
    content.innerHTML = `
      <div style="
        display:flex;
        flex-direction:column;
        align-items:center;
        animation: bounce 0.5s ease;
      ">
        <div style="
          width:40px;
          height:40px;
          background:linear-gradient(135deg, #f97316, #ea580c);
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          display:flex;
          align-items:center;
          justify-content:center;
          box-shadow:0 4px 12px rgba(249,115,22,0.4);
        ">
          <div style="
            transform:rotate(45deg);
            color:white;
            font-size:18px;
          ">📍</div>
        </div>
        <div style="
          width:8px;
          height:8px;
          background:rgba(0,0,0,0.2);
          border-radius:50%;
          margin-top:4px;
        "></div>
      </div>
      <style>
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      </style>
    `

    const marker = new kakao.maps.CustomOverlay({
      position,
      content,
      yAnchor: 1,
      xAnchor: 0.5,
      map
    })

    markerRef.current = marker

    // 지도 중심 이동
    map.panTo(position)
  }, [])

  // 좌표 → 주소 변환
  const getAddressFromCoords = useCallback((lat: number, lng: number) => {
    const geocoder = geocoderRef.current
    const kakao = (window as any).kakao

    if (!geocoder || !kakao) return

    setIsLoadingAddress(true)

    geocoder.coord2Address(lng, lat, (result: any[], status: string) => {
      if (status === kakao.maps.services.Status.OK && result[0]) {
        const address = result[0].address
        const roadAddress = result[0].road_address

        if (address) {
          setAddressInfo({
            address: roadAddress?.address_name || address.address_name,
            region: address.region_1depth_name,        // 서울특별시
            district: address.region_2depth_name,     // 강남구
            neighborhood: address.region_3depth_name  // 역삼동
          })
        } else if (roadAddress) {
          setAddressInfo({
            address: roadAddress.address_name,
            region: roadAddress.region_1depth_name,
            district: roadAddress.region_2depth_name,
            neighborhood: roadAddress.region_3depth_name
          })
        }
      }
      setIsLoadingAddress(false)
    })
  }, [])

  // 현재 위치로 이동
  const moveToCurrentLocation = useCallback(async () => {
    if (!navigator.geolocation) return

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        const kakao = (window as any).kakao
        const map = mapInstanceRef.current

        if (kakao && map) {
          const pos = new kakao.maps.LatLng(latitude, longitude)
          map.setCenter(pos)
          map.setLevel(3)

          // 현재 위치에 마커 설정
          updateMarker(latitude, longitude)
          setSelectedPosition({ lat: latitude, lng: longitude })
          getAddressFromCoords(latitude, longitude)
        }
      },
      (error) => {
        console.error("위치 정보 오류:", error)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [updateMarker, getAddressFromCoords])

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

  // 지도 로드 완료 시 자동으로 현재 위치로 이동
  useEffect(() => {
    if (isMapLoaded && !initialPosition) {
      moveToCurrentLocation()
    }
  }, [isMapLoaded, initialPosition, moveToCurrentLocation])

  // 위치 선택 완료
  const handleConfirm = () => {
    if (!selectedPosition || !addressInfo) return

    onSelect({
      latitude: selectedPosition.lat,
      longitude: selectedPosition.lng,
      address: addressInfo.address,
      region: addressInfo.region,
      district: addressInfo.district,
      neighborhood: addressInfo.neighborhood
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center">
      <div className="w-full max-w-md bg-white rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom duration-300 h-[85vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
          <h3 className="text-lg font-bold text-gray-900">위치 선택</h3>
          <button
            onClick={handleConfirm}
            disabled={!selectedPosition || !addressInfo || isLoadingAddress}
            className={cn(
              "p-1 rounded-full transition-colors",
              selectedPosition && addressInfo && !isLoadingAddress
                ? "text-orange-500 hover:bg-orange-50"
                : "text-gray-300"
            )}
          >
            <Check className="h-6 w-6" />
          </button>
        </div>

        {/* 안내 메시지 */}
        <div className="px-5 py-3 bg-orange-50 text-sm text-orange-700">
          <p>지도를 터치하여 음식점 위치를 선택해주세요</p>
        </div>

        {/* 지도 */}
        <div className="flex-1 relative">
          <Script
            src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_API_KEY}&libraries=services&autoload=false`}
            strategy="afterInteractive"
            onLoad={() => setIsScriptLoaded(true)}
          />

          <div ref={mapRef} className="absolute inset-0" />

          {!isMapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
          )}

          {/* 현위치 버튼 */}
          <button
            onClick={moveToCurrentLocation}
            className="absolute right-4 bottom-4 bg-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center border border-gray-100 active:scale-95 transition-transform"
          >
            <Navigation className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* 선택된 위치 정보 */}
        <div className="px-5 py-4 border-t border-gray-100 bg-white">
          {isLoadingAddress ? (
            <div className="flex items-center gap-3 text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">주소를 불러오는 중...</span>
            </div>
          ) : selectedPosition && addressInfo ? (
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-orange-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">{addressInfo.address}</p>
                  <p className="text-sm text-gray-500">
                    {addressInfo.region} {addressInfo.district} {addressInfo.neighborhood}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-gray-400">
              <MapPin className="h-5 w-5" />
              <span className="text-sm">지도에서 위치를 선택해주세요</span>
            </div>
          )}
        </div>

        {/* 확인 버튼 */}
        <div className="px-5 py-4 pb-safe border-t border-gray-100">
          <button
            onClick={handleConfirm}
            disabled={!selectedPosition || !addressInfo || isLoadingAddress}
            className={cn(
              "w-full py-3.5 rounded-xl font-medium transition-colors",
              selectedPosition && addressInfo && !isLoadingAddress
                ? "bg-orange-500 text-white hover:bg-orange-600"
                : "bg-gray-100 text-gray-400"
            )}
          >
            이 위치로 선택
          </button>
        </div>
      </div>
    </div>
  )
}
