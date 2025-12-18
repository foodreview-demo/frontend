"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Camera, Loader2 } from "lucide-react"
import { MobileLayout } from "@/components/mobile-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { RegionSelector } from "@/components/region-selector"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"

const CATEGORIES = [
  { value: "KOREAN", label: "한식" },
  { value: "JAPANESE", label: "일식" },
  { value: "CHINESE", label: "중식" },
  { value: "WESTERN", label: "양식" },
  { value: "CAFE", label: "카페" },
  { value: "BAKERY", label: "베이커리" },
  { value: "SNACK", label: "분식" },
]

export default function ProfileEditPage() {
  const router = useRouter()
  const { user, updateProfile } = useAuth()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    name: user?.name || "",
    region: user?.region || "",
    district: user?.district || "",
    neighborhood: user?.neighborhood || "",
    favoriteCategories: user?.favoriteCategories || [],
  })
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 파일 크기 체크 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "파일 크기는 5MB 이하여야 합니다",
        variant: "destructive"
      })
      return
    }

    // 이미지 파일 체크
    if (!file.type.startsWith('image/')) {
      toast({
        title: "이미지 파일만 업로드 가능합니다",
        variant: "destructive"
      })
      return
    }

    setAvatarFile(file)
    const reader = new FileReader()
    reader.onload = () => {
      setAvatarPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const toggleCategory = (category: string) => {
    setFormData(prev => ({
      ...prev,
      favoriteCategories: prev.favoriteCategories.includes(category)
        ? prev.favoriteCategories.filter(c => c !== category)
        : [...prev.favoriteCategories, category]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast({
        title: "이름을 입력해주세요",
        variant: "destructive"
      })
      return
    }

    if (!formData.region) {
      toast({
        title: "지역을 선택해주세요",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      let avatarUrl: string | undefined

      // 이미지가 선택되었으면 먼저 업로드
      if (avatarFile) {
        setIsUploadingImage(true)
        try {
          const uploadResult = await api.uploadImages([avatarFile])
          if (uploadResult.success && uploadResult.data.urls.length > 0) {
            avatarUrl = uploadResult.data.urls[0]
          }
        } catch (uploadError) {
          toast({
            title: "이미지 업로드에 실패했습니다",
            variant: "destructive"
          })
          setIsUploadingImage(false)
          setIsLoading(false)
          return
        }
        setIsUploadingImage(false)
      }

      await updateProfile({
        name: formData.name,
        region: formData.region,
        district: formData.district,
        neighborhood: formData.neighborhood,
        favoriteCategories: formData.favoriteCategories,
        ...(avatarUrl && { avatar: avatarUrl }),
      })
      toast({
        title: "프로필이 수정되었습니다",
      })
      router.back()
    } catch (error) {
      toast({
        title: "프로필 수정에 실패했습니다",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <MobileLayout hideNavigation>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold text-foreground">프로필 수정</h1>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-primary text-primary-foreground"
          >
            {isLoading ? "저장 중..." : "저장"}
          </Button>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="p-4 space-y-6">
        {/* Avatar */}
        <div className="flex justify-center">
          <div className="relative">
            <Avatar className="h-24 w-24 ring-4 ring-primary/20 cursor-pointer" onClick={handleAvatarClick}>
              <AvatarImage src={avatarPreview || user?.avatar || "/placeholder.svg"} alt={user?.name} />
              <AvatarFallback className="text-2xl">{user?.name?.[0]}</AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={handleAvatarClick}
              disabled={isUploadingImage}
              className="absolute bottom-0 right-0 h-8 w-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg"
            >
              {isUploadingImage ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>
        {avatarPreview && (
          <p className="text-center text-sm text-muted-foreground">
            새 프로필 이미지가 선택되었습니다. 저장을 눌러 적용하세요.
          </p>
        )}

        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">이름</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="이름을 입력하세요"
            maxLength={30}
          />
          <p className="text-xs text-muted-foreground text-right">
            {formData.name.length}/30
          </p>
        </div>

        {/* Region */}
        <div className="space-y-2">
          <Label>활동 지역</Label>
          <p className="text-sm text-muted-foreground mb-2">지역을 선택하면 해당 지역의 맛집 정보를 볼 수 있습니다</p>
          <RegionSelector
            region={formData.region}
            district={formData.district}
            neighborhood={formData.neighborhood}
            onChange={(region, district, neighborhood) =>
              setFormData(prev => ({ ...prev, region, district, neighborhood }))
            }
          />
        </div>

        {/* Favorite Categories */}
        <div className="space-y-2">
          <Label>선호 카테고리</Label>
          <p className="text-sm text-muted-foreground">관심있는 음식 카테고리를 선택하세요</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {CATEGORIES.map((category) => (
              <Badge
                key={category.value}
                variant={formData.favoriteCategories.includes(category.label) ? "default" : "outline"}
                className={`cursor-pointer transition-colors ${
                  formData.favoriteCategories.includes(category.label)
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-secondary"
                }`}
                onClick={() => toggleCategory(category.label)}
              >
                {category.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Email (Read-only) */}
        <div className="space-y-2">
          <Label>이메일</Label>
          <Input
            value={user?.email || ""}
            disabled
            className="bg-muted"
          />
          <p className="text-xs text-muted-foreground">이메일은 변경할 수 없습니다</p>
        </div>
      </form>
    </MobileLayout>
  )
}
