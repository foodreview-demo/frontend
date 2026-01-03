"use client"

import { useState, useEffect, Suspense, useRef, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Camera, Star, X, Sparkles, Search, MapPin, Loader2, Eye, Users, Navigation, Receipt } from "lucide-react"
import { MobileLayout } from "@/components/mobile-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { KakaoMapSearch, KakaoPlace } from "@/components/kakao-map-search"
import { RegionSelector } from "@/components/region-selector"
import { cn } from "@/lib/utils"
import { api, Restaurant, Review } from "@/lib/api"
import { parseAddress } from "@/lib/regions"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

function WriteReviewContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const restaurantIdParam = searchParams.get("restaurantId")

  // 검색 페이지에서 전달된 카카오 장소 정보
  const kakaoPlaceIdParam = searchParams.get("kakaoPlaceId")
  const kakaoNameParam = searchParams.get("name")
  const kakaoAddressParam = searchParams.get("address")
  const kakaoJibunAddressParam = searchParams.get("jibunAddress") // 지번 주소 (지역 파싱용)
  const kakaoCategoryParam = searchParams.get("category")
  const kakaoPhoneParam = searchParams.get("phone")
  const kakaoXParam = searchParams.get("x")
  const kakaoYParam = searchParams.get("y")

  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null)
  const [selectedKakaoPlace, setSelectedKakaoPlace] = useState<KakaoPlace | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchMode, setSearchMode] = useState<"app" | "kakao">("kakao")
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [isRatingManual, setIsRatingManual] = useState(false) // 수동으로 종합 평점을 설정했는지
  // 세부 별점
  const [tasteRating, setTasteRating] = useState(0)
  const [hoverTasteRating, setHoverTasteRating] = useState(0)
  const [priceRating, setPriceRating] = useState(0)
  const [hoverPriceRating, setHoverPriceRating] = useState(0)
  const [atmosphereRating, setAtmosphereRating] = useState(0)
  const [hoverAtmosphereRating, setHoverAtmosphereRating] = useState(0)
  const [serviceRating, setServiceRating] = useState(0)
  const [hoverServiceRating, setHoverServiceRating] = useState(0)
  const [content, setContent] = useState("")
  const [menu, setMenu] = useState("")
  const [price, setPrice] = useState("")
  const [images, setImages] = useState<string[]>([])
  const [receiptImage, setReceiptImage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const receiptInputRef = useRef<HTMLInputElement>(null)

  // 지역 정보 (카카오 주소에서 파싱 후 사용자 수정 가능)
  const [region, setRegion] = useState("")
  const [district, setDistrict] = useState("")
  const [neighborhood, setNeighborhood] = useState("")

  // 앱 내 검색용 지역 필터
  const [appSearchRegion, setAppSearchRegion] = useState("")
  const [appSearchDistrict, setAppSearchDistrict] = useState("")
  const [appSearchNeighborhood, setAppSearchNeighborhood] = useState("")
  const [appRestaurants, setAppRestaurants] = useState<Restaurant[]>([])
  const [isLoadingAppRestaurants, setIsLoadingAppRestaurants] = useState(false)

  // 참고 리뷰 관련 상태
  const [existingReviews, setExistingReviews] = useState<Review[]>([])
  const [isLoadingReviews, setIsLoadingReviews] = useState(false)
  const [selectedReferenceReview, setSelectedReferenceReview] = useState<Review | null>(null)
  const [showReferenceModal, setShowReferenceModal] = useState(false)
  const [showReviewListModal, setShowReviewListModal] = useState(false)
  const [referenceType, setReferenceType] = useState<"none" | "passing" | "friend" | "review" | null>(null)
  const [reviewSearchQuery, setReviewSearchQuery] = useState("")
  const [reviewPage, setReviewPage] = useState(0)
  const [reviewTotalPages, setReviewTotalPages] = useState(0)
  const [reviewTotalElements, setReviewTotalElements] = useState(0)

  // Load preselected restaurant or kakao place
  useEffect(() => {
    const loadPreselected = async () => {
      // DB 음식점 ID가 있으면 해당 음식점 로드
      if (restaurantIdParam) {
        try {
          const result = await api.getRestaurant(Number(restaurantIdParam))
          if (result.success) {
            setSelectedRestaurant(result.data)
          }
        } catch (err) {
          console.error("음식점 로드 실패:", err)
        }
      }
      // 카카오 장소 정보가 있으면 KakaoPlace 객체 생성
      else if (kakaoPlaceIdParam && kakaoNameParam && kakaoAddressParam) {
        const kakaoPlace: KakaoPlace = {
          id: kakaoPlaceIdParam,
          name: kakaoNameParam,
          address: kakaoJibunAddressParam || kakaoAddressParam, // 지번 주소 우선
          roadAddress: kakaoAddressParam,
          category: kakaoCategoryParam || '음식점',
          categoryCode: '',
          phone: kakaoPhoneParam || '',
          x: kakaoXParam || '0',
          y: kakaoYParam || '0',
          placeUrl: '',
        }
        setSelectedKakaoPlace(kakaoPlace)

        // 지번 주소에서 지역 정보 파싱
        const addressToParse = kakaoJibunAddressParam || kakaoAddressParam
        const parsed = parseAddress(addressToParse)
        setRegion(parsed.region)
        setDistrict(parsed.district)
        setNeighborhood(parsed.neighborhood)
      }
    }
    loadPreselected()
  }, [restaurantIdParam, kakaoPlaceIdParam, kakaoNameParam, kakaoAddressParam, kakaoJibunAddressParam, kakaoCategoryParam, kakaoPhoneParam, kakaoXParam, kakaoYParam])

  // 리뷰 목록을 가져올 음식점 ID (DB에 등록된 경우)
  const [existingRestaurantId, setExistingRestaurantId] = useState<number | null>(null)

  // 음식점 선택 시 기존 리뷰 목록 로드
  useEffect(() => {
    const loadExistingReviews = async () => {
      if (!selectedRestaurant) {
        if (!existingRestaurantId) {
          setExistingReviews([])
          setReviewTotalPages(0)
          setReviewTotalElements(0)
        }
        return
      }

      setExistingRestaurantId(selectedRestaurant.id)
      setIsLoadingReviews(true)
      try {
        const result = await api.getRestaurantReviews(selectedRestaurant.id, 0, 10)
        if (result.success) {
          setExistingReviews(result.data.content)
          setReviewTotalPages(result.data.totalPages)
          setReviewTotalElements(result.data.totalElements)
        }
      } catch (err) {
        console.error("기존 리뷰 로드 실패:", err)
      } finally {
        setIsLoadingReviews(false)
      }
    }

    loadExistingReviews()
  }, [selectedRestaurant, existingRestaurantId])

  // 리뷰 목록 로드 함수 (페이지네이션용)
  const loadReviews = useCallback(async (page: number) => {
    const restaurantId = selectedRestaurant?.id || existingRestaurantId
    if (!restaurantId) return

    setIsLoadingReviews(true)
    try {
      const result = await api.getRestaurantReviews(restaurantId, page, 10)
      if (result.success) {
        setExistingReviews(result.data.content)
        setReviewPage(page)
        setReviewTotalPages(result.data.totalPages)
        setReviewTotalElements(result.data.totalElements)
      }
    } catch (err) {
      console.error("리뷰 로드 실패:", err)
    } finally {
      setIsLoadingReviews(false)
    }
  }, [selectedRestaurant, existingRestaurantId])

  // 세부 별점 변경 시 종합 평점 자동 계산
  useEffect(() => {
    if (isRatingManual) return // 수동 설정 시 자동 계산 안함

    const ratings = [tasteRating, priceRating, atmosphereRating, serviceRating].filter(r => r > 0)
    if (ratings.length > 0) {
      const avg = ratings.reduce((sum, r) => sum + r, 0) / ratings.length
      setRating(Math.round(avg))
    }
  }, [tasteRating, priceRating, atmosphereRating, serviceRating, isRatingManual])

  // 앱 내 검색 지역 변경 핸들러
  const handleAppSearchRegionChange = (newRegion: string, newDistrict: string, newNeighborhood: string) => {
    setAppSearchRegion(newRegion)
    setAppSearchDistrict(newDistrict)
    setAppSearchNeighborhood(newNeighborhood)
  }

  // 지역 선택 시 음식점 목록 로드
  useEffect(() => {
    const loadRestaurants = async () => {
      if (!appSearchRegion) {
        setAppRestaurants([])
        return
      }

      setIsLoadingAppRestaurants(true)
      try {
        const result = await api.getRestaurants(
          appSearchRegion,
          appSearchDistrict || undefined,
          appSearchNeighborhood || undefined,
          undefined,
          0,
          50
        )
        if (result.success) {
          setAppRestaurants(result.data.content)
        }
      } catch (err) {
        console.error("음식점 로드 실패:", err)
      } finally {
        setIsLoadingAppRestaurants(false)
      }
    }

    loadRestaurants()
  }, [appSearchRegion, appSearchDistrict, appSearchNeighborhood])

  // 검색어로 음식점 필터링 (로컬 필터링)
  const filteredRestaurants = appRestaurants.filter((restaurant) => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      restaurant.name.toLowerCase().includes(query) ||
      restaurant.address.toLowerCase().includes(query) ||
      restaurant.categoryDisplay?.toLowerCase().includes(query)
    )
  })

  const isFirstReview = selectedRestaurant?.reviewCount === 0
  const hasSelectedPlace = selectedRestaurant || selectedKakaoPlace

  // 카카오 장소 선택 핸들러
  const handleKakaoPlaceSelect = async (place: KakaoPlace) => {
    setSelectedKakaoPlace(place)
    setSelectedRestaurant(null)
    setExistingReviews([])
    setSelectedReferenceReview(null)
    setExistingRestaurantId(null)
    setReviewPage(0)
    setReviewTotalPages(0)
    setReviewTotalElements(0)

    // 주소에서 지역 정보 파싱 (지번 주소 사용 - 동 정보 포함)
    const parsed = parseAddress(place.address)
    setRegion(parsed.region)
    setDistrict(parsed.district)
    setNeighborhood(parsed.neighborhood)

    // 카카오 Place ID로 기존 등록된 음식점인지 확인하고 리뷰 로드
    try {
      const result = await api.getRestaurantByKakaoPlaceId(place.id)
      if (result.success && result.data) {
        // 기존 등록된 음식점이면 ID 저장 및 리뷰 로드
        setExistingRestaurantId(result.data.id)
        const reviewsResult = await api.getRestaurantReviews(result.data.id, 0, 10)
        if (reviewsResult.success) {
          setExistingReviews(reviewsResult.data.content)
          setReviewTotalPages(reviewsResult.data.totalPages)
          setReviewTotalElements(reviewsResult.data.totalElements)
        }
      }
    } catch (err) {
      console.error("기존 음식점 조회 실패:", err)
    }
  }

  // 지역 변경 핸들러
  const handleRegionChange = (newRegion: string, newDistrict: string, newNeighborhood: string) => {
    setRegion(newRegion)
    setDistrict(newDistrict)
    setNeighborhood(newNeighborhood)
  }

  // 장소 선택 초기화
  const clearSelectedPlace = () => {
    setSelectedRestaurant(null)
    setSelectedKakaoPlace(null)
    setRegion("")
    setDistrict("")
    setNeighborhood("")
    setSelectedReferenceReview(null)
    setExistingReviews([])
    setReferenceType(null)
    setExistingRestaurantId(null)
    setReviewPage(0)
    setReviewTotalPages(0)
    setReviewTotalElements(0)
    setReviewSearchQuery("")
  }

  const handleImageButtonClick = () => {
    fileInputRef.current?.click()
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const remainingSlots = 5 - images.length
    if (remainingSlots <= 0) {
      alert("이미지는 최대 5장까지 업로드할 수 있습니다")
      return
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots)

    // Validate file types
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    const invalidFiles = filesToUpload.filter(file => !validTypes.includes(file.type))
    if (invalidFiles.length > 0) {
      alert("JPEG, PNG, GIF, WebP 형식의 이미지만 업로드할 수 있습니다")
      return
    }

    // Validate file sizes (max 10MB each)
    const oversizedFiles = filesToUpload.filter(file => file.size > 10 * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      alert("각 이미지 파일 크기는 10MB를 초과할 수 없습니다")
      return
    }

    setIsUploading(true)
    try {
      const result = await api.uploadImages(filesToUpload)
      if (result.success) {
        setImages([...images, ...result.data.urls])
      }
    } catch (error) {
      console.error("이미지 업로드 실패:", error)
      alert(error instanceof Error ? error.message : "이미지 업로드에 실패했습니다")
    } finally {
      setIsUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const handleReceiptButtonClick = () => {
    receiptInputRef.current?.click()
  }

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      alert("JPEG, PNG, GIF, WebP 형식의 이미지만 업로드할 수 있습니다")
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("이미지 파일 크기는 10MB를 초과할 수 없습니다")
      return
    }

    setIsUploadingReceipt(true)
    try {
      const result = await api.uploadImages([file])
      if (result.success) {
        setReceiptImage(result.data.urls[0])
      }
    } catch (error) {
      console.error("영수증 업로드 실패:", error)
      alert(error instanceof Error ? error.message : "영수증 업로드에 실패했습니다")
    } finally {
      setIsUploadingReceipt(false)
      if (receiptInputRef.current) {
        receiptInputRef.current.value = ""
      }
    }
  }

  const handleSubmit = async () => {
    if (!hasSelectedPlace || rating === 0 || !content || !menu) {
      alert("필수 항목을 모두 입력해주세요")
      return
    }

    setIsSubmitting(true)

    try {
      let restaurantId: number

      // 카카오 장소 선택 시 먼저 음식점 등록
      if (selectedKakaoPlace) {
        // 카테고리 추출 (예: "음식점 > 한식 > 국밥" -> "KOREAN")
        const categoryMap: Record<string, string> = {
          '한식': 'KOREAN',
          '일식': 'JAPANESE',
          '중식': 'CHINESE',
          '양식': 'WESTERN',
          '카페': 'CAFE',
          '베이커리': 'BAKERY',
          '분식': 'SNACK',
        }
        const categoryParts = selectedKakaoPlace.category.split(' > ')
        let category = 'KOREAN' // 기본값
        for (const part of categoryParts) {
          if (categoryMap[part]) {
            category = categoryMap[part]
            break
          }
        }

        const restaurantResult = await api.createRestaurant({
          name: selectedKakaoPlace.name,
          category,
          address: selectedKakaoPlace.address, // 지번 주소(구주소) 사용
          region: region || '서울',
          district: district || undefined,
          neighborhood: neighborhood || undefined,
          phone: selectedKakaoPlace.phone || undefined,
          kakaoPlaceId: selectedKakaoPlace.id,
          latitude: parseFloat(selectedKakaoPlace.y),
          longitude: parseFloat(selectedKakaoPlace.x),
        })

        if (!restaurantResult.success) {
          throw new Error(restaurantResult.message || '음식점 등록에 실패했습니다')
        }
        restaurantId = restaurantResult.data.id
      } else if (selectedRestaurant) {
        restaurantId = selectedRestaurant.id
      } else {
        throw new Error('음식점을 선택해주세요')
      }

      // 리뷰 작성
      const reviewResult = await api.createReview({
        restaurantId,
        content,
        rating,
        tasteRating: tasteRating > 0 ? tasteRating : undefined,
        priceRating: priceRating > 0 ? priceRating : undefined,
        atmosphereRating: atmosphereRating > 0 ? atmosphereRating : undefined,
        serviceRating: serviceRating > 0 ? serviceRating : undefined,
        images: images.length > 0 ? images : undefined,
        receiptImageUrl: receiptImage || undefined,
        menu,
        price: price || undefined,
        referenceReviewId: selectedReferenceReview?.id,
      })

      if (!reviewResult.success) {
        throw new Error(reviewResult.message || '리뷰 작성에 실패했습니다')
      }

      const isFirst = reviewResult.data.isFirstReview
      alert(isFirst ? "첫 리뷰 작성 완료! 맛잘알 점수가 2배로 적용됩니다!" : "리뷰가 등록되었습니다!")
      router.push("/?refresh=true")
    } catch (error) {
      console.error("리뷰 작성 실패:", error)
      alert(error instanceof Error ? error.message : "리뷰 작성에 실패했습니다")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <MobileLayout>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="font-bold text-lg text-foreground">리뷰 작성</h1>
          <Button
            onClick={handleSubmit}
            disabled={!hasSelectedPlace || rating === 0 || !content || !menu || isSubmitting}
            className="bg-primary text-primary-foreground"
          >
            {isSubmitting ? "등록 중..." : "등록"}
          </Button>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* First Review Notice */}
        {isFirstReview && (
          <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-primary flex-shrink-0" />
            <div>
              <p className="font-semibold text-foreground">첫 리뷰 보너스!</p>
              <p className="text-sm text-muted-foreground">이 음식점의 첫 리뷰어가 되면 맛잘알 점수가 2배!</p>
            </div>
          </div>
        )}

        {/* Restaurant Selection */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">음식점 선택 *</label>

          {/* 선택된 음식점 표시 */}
          {selectedRestaurant ? (
            <Card className="p-3 flex items-center gap-3 border border-border">
              <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-muted">
                <Image
                  src={selectedRestaurant.thumbnail || "/placeholder.svg"}
                  alt={selectedRestaurant.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">{selectedRestaurant.name}</h3>
                  <Badge variant="outline" className="text-xs">
                    {selectedRestaurant.categoryDisplay || selectedRestaurant.category}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{selectedRestaurant.address}</p>
                {selectedRestaurant.reviewCount === 0 && (
                  <Badge className="mt-1 bg-primary text-primary-foreground text-xs">첫 리뷰 가능</Badge>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={clearSelectedPlace}>
                <X className="h-4 w-4" />
              </Button>
            </Card>
          ) : selectedKakaoPlace ? (
            <Card className="p-3 border border-primary bg-primary/5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-foreground">{selectedKakaoPlace.name}</h3>
                    <Badge variant="outline" className="text-xs">
                      {selectedKakaoPlace.category.split(' > ').pop()}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedKakaoPlace.address}
                  </p>
                  {selectedKakaoPlace.phone && (
                    <p className="text-xs text-muted-foreground">{selectedKakaoPlace.phone}</p>
                  )}
                  <Badge className="mt-2 bg-primary text-primary-foreground text-xs">
                    <Sparkles className="h-3 w-3 mr-1" />
                    첫 리뷰 가능
                  </Badge>
                </div>
                <Button variant="ghost" size="icon" onClick={clearSelectedPlace}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {/* 지역 선택 */}
              <div className="mt-3 pt-3 border-t border-border">
                <label className="text-xs font-medium text-muted-foreground mb-2 block">
                  지역 설정 (수정 가능)
                </label>
                <RegionSelector
                  region={region}
                  district={district}
                  neighborhood={neighborhood}
                  onChange={handleRegionChange}
                  size="sm"
                />
              </div>
            </Card>
          ) : (
            <Tabs value={searchMode} onValueChange={(v) => setSearchMode(v as "app" | "kakao")}>
              <TabsList className="grid w-full grid-cols-2 mb-3">
                <TabsTrigger value="kakao" className="gap-1">
                  <MapPin className="h-4 w-4" />
                  지도 검색
                </TabsTrigger>
                <TabsTrigger value="app" className="gap-1">
                  <Search className="h-4 w-4" />
                  앱 내 검색
                </TabsTrigger>
              </TabsList>

              <TabsContent value="kakao" className="mt-0">
                <KakaoMapSearch
                  onSelectPlace={handleKakaoPlaceSelect}
                  selectedPlace={selectedKakaoPlace}
                  onClear={clearSelectedPlace}
                />
              </TabsContent>

              <TabsContent value="app" className="mt-0 space-y-3">
                {/* 지역 선택 */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">
                    지역을 선택하세요
                  </label>
                  <RegionSelector
                    region={appSearchRegion}
                    district={appSearchDistrict}
                    neighborhood={appSearchNeighborhood}
                    onChange={handleAppSearchRegionChange}
                    showAllOption={true}
                    size="sm"
                  />
                </div>

                {/* 검색 필터 */}
                {appSearchRegion && (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="음식점 이름으로 필터링"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 h-9 text-sm"
                    />
                  </div>
                )}

                {/* 로딩 */}
                {isLoadingAppRestaurants && (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                )}

                {/* 음식점 목록 */}
                {!isLoadingAppRestaurants && appSearchRegion && filteredRestaurants.length > 0 && (
                  <div className="bg-card border border-border rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                    {filteredRestaurants.map((restaurant) => (
                      <button
                        key={restaurant.id}
                        className="w-full p-3 flex items-center gap-3 hover:bg-secondary transition-colors text-left border-b border-border last:border-0"
                        onClick={() => {
                          setSelectedRestaurant(restaurant)
                          setSelectedKakaoPlace(null)
                          setSearchQuery("")
                        }}
                      >
                        <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-muted">
                          <Image
                            src={restaurant.thumbnail || "/placeholder.svg"}
                            alt={restaurant.name}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{restaurant.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {restaurant.categoryDisplay || restaurant.category}
                            </Badge>
                            {restaurant.reviewCount === 0 && (
                              <Badge className="bg-primary text-primary-foreground text-xs">첫 리뷰</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{restaurant.address}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* 안내 메시지 */}
                {!appSearchRegion && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    지역을 선택하면 등록된 음식점 목록이 표시됩니다
                  </p>
                )}
                {appSearchRegion && !isLoadingAppRestaurants && filteredRestaurants.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {searchQuery ? "검색 결과가 없습니다" : "등록된 음식점이 없습니다"}. 지도 검색을 이용해보세요.
                  </p>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>

        {/* Rating */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-foreground">종합 평점 *</label>
            {!isRatingManual && rating > 0 && (
              <span className="text-xs text-muted-foreground">세부 평점 평균으로 자동 계산됨</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => {
                  setRating(star)
                  setIsRatingManual(true)
                }}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={cn(
                    "h-8 w-8 transition-colors",
                    star <= (hoverRating || rating) ? "fill-primary text-primary" : "fill-muted text-muted",
                  )}
                />
              </button>
            ))}
            {rating > 0 && <span className="ml-2 text-lg font-semibold text-foreground">{rating}점</span>}
            {isRatingManual && (
              <button
                onClick={() => setIsRatingManual(false)}
                className="ml-2 text-xs text-primary hover:underline"
              >
                자동 계산
              </button>
            )}
          </div>
        </div>

        {/* Detail Ratings */}
        <div className="bg-secondary/30 rounded-xl p-4 space-y-4">
          <label className="text-sm font-medium text-foreground block">세부 평점 (선택)</label>

          {/* 맛 */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground w-16">맛</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHoverTasteRating(star)}
                  onMouseLeave={() => setHoverTasteRating(0)}
                  onClick={() => setTasteRating(tasteRating === star ? 0 : star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      "h-5 w-5 transition-colors",
                      star <= (hoverTasteRating || tasteRating) ? "fill-primary text-primary" : "fill-muted text-muted",
                    )}
                  />
                </button>
              ))}
              {tasteRating > 0 && <span className="ml-2 text-sm font-medium text-foreground w-8">{tasteRating}점</span>}
              {tasteRating === 0 && <span className="ml-2 text-sm text-muted-foreground w-8">-</span>}
            </div>
          </div>

          {/* 가격 */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground w-16">가격</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHoverPriceRating(star)}
                  onMouseLeave={() => setHoverPriceRating(0)}
                  onClick={() => setPriceRating(priceRating === star ? 0 : star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      "h-5 w-5 transition-colors",
                      star <= (hoverPriceRating || priceRating) ? "fill-primary text-primary" : "fill-muted text-muted",
                    )}
                  />
                </button>
              ))}
              {priceRating > 0 && <span className="ml-2 text-sm font-medium text-foreground w-8">{priceRating}점</span>}
              {priceRating === 0 && <span className="ml-2 text-sm text-muted-foreground w-8">-</span>}
            </div>
          </div>

          {/* 분위기 */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground w-16">분위기</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHoverAtmosphereRating(star)}
                  onMouseLeave={() => setHoverAtmosphereRating(0)}
                  onClick={() => setAtmosphereRating(atmosphereRating === star ? 0 : star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      "h-5 w-5 transition-colors",
                      star <= (hoverAtmosphereRating || atmosphereRating) ? "fill-primary text-primary" : "fill-muted text-muted",
                    )}
                  />
                </button>
              ))}
              {atmosphereRating > 0 && <span className="ml-2 text-sm font-medium text-foreground w-8">{atmosphereRating}점</span>}
              {atmosphereRating === 0 && <span className="ml-2 text-sm text-muted-foreground w-8">-</span>}
            </div>
          </div>

          {/* 친절도 */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground w-16">친절도</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHoverServiceRating(star)}
                  onMouseLeave={() => setHoverServiceRating(0)}
                  onClick={() => setServiceRating(serviceRating === star ? 0 : star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      "h-5 w-5 transition-colors",
                      star <= (hoverServiceRating || serviceRating) ? "fill-primary text-primary" : "fill-muted text-muted",
                    )}
                  />
                </button>
              ))}
              {serviceRating > 0 && <span className="ml-2 text-sm font-medium text-foreground w-8">{serviceRating}점</span>}
              {serviceRating === 0 && <span className="ml-2 text-sm text-muted-foreground w-8">-</span>}
            </div>
          </div>
        </div>

        {/* Menu & Price */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">메뉴 *</label>
            <Input placeholder="주문한 메뉴" value={menu} onChange={(e) => setMenu(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">가격</label>
            <Input placeholder="예: 12,000원" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
        </div>

        {/* Images */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">사진 (최대 5장)</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />
          <div className="flex gap-2 flex-wrap">
            {images.map((image, index) => (
              <div key={index} className="relative h-20 w-20 rounded-lg overflow-hidden bg-muted">
                <Image
                  src={image || "/placeholder.svg"}
                  alt={`업로드 이미지 ${index + 1}`}
                  fill
                  className="object-cover"
                  unoptimized
                />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 bg-background/80 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {images.length < 5 && (
              <button
                onClick={handleImageButtonClick}
                disabled={isUploading}
                className="h-20 w-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <Camera className="h-6 w-6" />
                )}
              </button>
            )}
          </div>
          {isUploading && (
            <p className="text-xs text-muted-foreground mt-2">이미지 업로드 중...</p>
          )}
        </div>

        {/* Receipt Image */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            영수증 사진 (선택)
          </label>
          <p className="text-xs text-muted-foreground mb-2">
            영수증을 첨부하면 &apos;인증됨&apos; 배지가 표시됩니다
          </p>
          <input
            ref={receiptInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleReceiptUpload}
            className="hidden"
          />
          <div className="flex gap-2">
            {receiptImage ? (
              <div className="relative h-24 w-24 rounded-lg overflow-hidden bg-muted border-2 border-primary">
                <Image
                  src={receiptImage}
                  alt="영수증 이미지"
                  fill
                  className="object-cover"
                  unoptimized
                />
                <button
                  onClick={() => setReceiptImage(null)}
                  className="absolute top-1 right-1 bg-background/80 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-primary/90 text-primary-foreground text-[10px] text-center py-0.5">
                  영수증
                </div>
              </div>
            ) : (
              <button
                onClick={handleReceiptButtonClick}
                disabled={isUploadingReceipt}
                className="h-24 w-24 rounded-lg border-2 border-dashed border-primary/50 flex flex-col items-center justify-center text-primary hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploadingReceipt ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <>
                    <Receipt className="h-6 w-6 mb-1" />
                    <span className="text-xs">영수증</span>
                  </>
                )}
              </button>
            )}
          </div>
          {isUploadingReceipt && (
            <p className="text-xs text-muted-foreground mt-2">영수증 업로드 중...</p>
          )}
        </div>

        {/* Content */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">리뷰 내용 *</label>
          <Textarea
            placeholder="음식의 맛, 분위기, 서비스 등 솔직한 후기를 남겨주세요"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground mt-1">{content.length}/500자</p>
        </div>

        {/* Reference Review Selection */}
        <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              이 음식점을 어떻게 알게 됐나요? (선택)
            </label>
            {referenceType ? (
              <Card className="p-3 border border-primary/30 bg-primary/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {referenceType === "passing" && (
                      <>
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Navigation className="h-5 w-5 text-primary" />
                        </div>
                        <p className="text-sm font-medium text-foreground">지나가다 발견했어요</p>
                      </>
                    )}
                    {referenceType === "friend" && (
                      <>
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <p className="text-sm font-medium text-foreground">지인에게 소개받았어요</p>
                      </>
                    )}
                    {referenceType === "review" && selectedReferenceReview && (
                      <>
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={selectedReferenceReview.user.avatar} />
                          <AvatarFallback>{selectedReferenceReview.user.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {selectedReferenceReview.user.name}님의 리뷰를 참고했어요
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            "{selectedReferenceReview.content}"
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setReferenceType(null)
                      setSelectedReferenceReview(null)
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ) : (
              <Button
                variant="outline"
                className="w-full justify-start text-muted-foreground"
                onClick={() => setShowReferenceModal(true)}
              >
                선택하기
              </Button>
            )}
            {referenceType === "review" && (
              <p className="text-xs text-muted-foreground mt-2">
                참고한 리뷰 작성자에게 영향력 포인트가 지급됩니다
              </p>
            )}
        </div>

        {/* Reference Selection Modal */}
        <Dialog open={showReferenceModal} onOpenChange={setShowReferenceModal}>
          <DialogContent className="max-w-sm mx-auto">
            <DialogHeader>
              <DialogTitle>이 음식점을 어떻게 알게 됐나요?</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 mt-2">
              {/* 지나가다 발견 */}
              <button
                className="w-full p-4 flex items-center gap-4 rounded-xl border border-border hover:bg-secondary transition-colors text-left"
                onClick={() => {
                  setReferenceType("passing")
                  setSelectedReferenceReview(null)
                  setShowReferenceModal(false)
                }}
              >
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Navigation className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">지나가다 발견했어요</p>
                  <p className="text-sm text-muted-foreground">우연히 가게를 발견해서 방문했어요</p>
                </div>
              </button>

              {/* 지인 소개 */}
              <button
                className="w-full p-4 flex items-center gap-4 rounded-xl border border-border hover:bg-secondary transition-colors text-left"
                onClick={() => {
                  setReferenceType("friend")
                  setSelectedReferenceReview(null)
                  setShowReferenceModal(false)
                }}
              >
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">지인에게 소개받았어요</p>
                  <p className="text-sm text-muted-foreground">친구나 가족이 추천해줬어요</p>
                </div>
              </button>

              {/* 다른 리뷰 참고 */}
              {reviewTotalElements > 0 ? (
                <button
                  className="w-full p-4 flex items-center gap-4 rounded-xl border border-border hover:bg-secondary transition-colors text-left"
                  onClick={() => {
                    setShowReferenceModal(false)
                    setShowReviewListModal(true)
                    setReviewSearchQuery("")
                    setReviewPage(0)
                    loadReviews(0)
                  }}
                >
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Eye className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">다른 사람의 리뷰를 봤어요</p>
                    <p className="text-sm text-muted-foreground">{reviewTotalElements}개의 리뷰에서 선택</p>
                  </div>
                </button>
              ) : (
                <div className="p-4 flex items-center gap-4 rounded-xl border border-border bg-muted/30">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <Eye className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">다른 사람의 리뷰를 봤어요</p>
                    <p className="text-sm text-muted-foreground">아직 등록된 리뷰가 없어요</p>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Review List Modal */}
        <Dialog open={showReviewListModal} onOpenChange={setShowReviewListModal}>
          <DialogContent className="max-w-md mx-auto max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>참고한 리뷰 선택</DialogTitle>
            </DialogHeader>

            {/* 검색 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="닉네임으로 검색"
                value={reviewSearchQuery}
                onChange={(e) => setReviewSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* 리뷰 목록 */}
            <div className="flex-1 overflow-y-auto min-h-0 -mx-6 px-6">
              {isLoadingReviews ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-2">
                  {existingReviews
                    .filter(review =>
                      !reviewSearchQuery ||
                      review.user.name.toLowerCase().includes(reviewSearchQuery.toLowerCase())
                    )
                    .map((review) => (
                      <button
                        key={review.id}
                        className="w-full p-3 flex items-start gap-3 rounded-xl border border-border hover:bg-secondary transition-colors text-left"
                        onClick={() => {
                          setReferenceType("review")
                          setSelectedReferenceReview(review)
                          setShowReviewListModal(false)
                        }}
                      >
                        <Avatar className="h-10 w-10 flex-shrink-0">
                          <AvatarImage src={review.user.avatar} />
                          <AvatarFallback>{review.user.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-foreground">
                              {review.user.name}
                            </span>
                            <div className="flex items-center">
                              <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                              <span className="text-sm text-muted-foreground ml-0.5">
                                {review.rating}
                              </span>
                            </div>
                            {review.isFirstReview && (
                              <Badge className="text-[10px] px-1.5 py-0.5 bg-primary/20 text-primary">
                                첫 리뷰
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {review.content}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </button>
                    ))}
                  {existingReviews.filter(review =>
                    !reviewSearchQuery ||
                    review.user.name.toLowerCase().includes(reviewSearchQuery.toLowerCase())
                  ).length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      {reviewSearchQuery ? "검색 결과가 없습니다" : "리뷰가 없습니다"}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* 페이지네이션 */}
            {reviewTotalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={reviewPage === 0 || isLoadingReviews}
                  onClick={() => loadReviews(reviewPage - 1)}
                >
                  이전
                </Button>
                <span className="text-sm text-muted-foreground">
                  {reviewPage + 1} / {reviewTotalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={reviewPage >= reviewTotalPages - 1 || isLoadingReviews}
                  onClick={() => loadReviews(reviewPage + 1)}
                >
                  다음
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Guidelines */}
        <div className="bg-secondary/50 rounded-xl p-4">
          <h4 className="font-medium text-foreground mb-2 text-sm">리뷰 작성 가이드</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• 직접 방문한 경험을 솔직하게 작성해주세요</li>
            <li>• 영수증을 첨부하면 &apos;인증됨&apos; 배지가 표시됩니다</li>
            <li>• 광고성 리뷰나 허위 리뷰는 삭제될 수 있습니다</li>
            <li>• 첫 리뷰 작성 시 맛잘알 점수가 2배로 적용됩니다</li>
            <li>• 공감을 많이 받을수록 맛잘알 점수가 올라갑니다</li>
            <li>• 다른 리뷰를 참고했다면 선택해주세요 - 리뷰어에게 보상이 갑니다</li>
          </ul>
        </div>
      </div>
    </MobileLayout>
  )
}

export default function WriteReviewPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">로딩 중...</div>}>
      <WriteReviewContent />
    </Suspense>
  )
}
