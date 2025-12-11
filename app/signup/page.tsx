"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, ArrowLeft, Eye, EyeOff, Check } from "lucide-react"
import { regions } from "@/lib/constants"
import { cn } from "@/lib/utils"

export default function SignUpPage() {
  const router = useRouter()
  const { signUp } = useAuth()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    region: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (formData.password !== formData.confirmPassword) {
      setError("비밀번호가 일치하지 않습니다")
      return
    }

    if (formData.password.length < 8) {
      setError("비밀번호는 8자 이상이어야 합니다")
      return
    }

    if (!formData.region) {
      setError("지역을 선택해주세요")
      return
    }

    setIsLoading(true)

    try {
      await signUp({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        region: formData.region,
      })
      router.push("/login?registered=true")
    } catch (err) {
      setError(err instanceof Error ? err.message : "회원가입에 실패했습니다")
    } finally {
      setIsLoading(false)
    }
  }

  const availableRegions = regions.filter(r => r !== "전체")

  // 비밀번호 유효성 체크
  const passwordChecks = {
    length: formData.password.length >= 8,
    match: formData.password === formData.confirmPassword && formData.confirmPassword.length > 0,
  }

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto">
      {/* Header */}
      <header className="flex items-center px-4 py-3">
        <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-secondary rounded-full transition-colors">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
      </header>

      <div className="flex-1 flex flex-col px-6 pt-4 pb-12 overflow-y-auto">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">회원가입</h1>
          <p className="text-muted-foreground">맛잘알 커뮤니티의 멤버가 되세요</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-4 text-sm text-red-600 bg-red-50 rounded-xl border border-red-100">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-foreground">이메일</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="h-12 px-4 rounded-xl bg-secondary/50 border-0 focus:bg-background focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-foreground">닉네임</Label>
            <Input
              id="name"
              type="text"
              placeholder="맛잘알 닉네임 (2-30자)"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              minLength={2}
              maxLength={30}
              className="h-12 px-4 rounded-xl bg-secondary/50 border-0 focus:bg-background focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="region" className="text-sm font-medium text-foreground">지역</Label>
            <Select
              value={formData.region}
              onValueChange={(value) => setFormData({ ...formData, region: value })}
            >
              <SelectTrigger className="h-12 px-4 rounded-xl bg-secondary/50 border-0 focus:bg-background focus:ring-2 focus:ring-primary">
                <SelectValue placeholder="지역을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {availableRegions.map((region) => (
                  <SelectItem key={region} value={region}>
                    {region}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-foreground">비밀번호</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="8자 이상 입력하세요"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={8}
                className="h-12 px-4 pr-12 rounded-xl bg-secondary/50 border-0 focus:bg-background focus:ring-2 focus:ring-primary"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">비밀번호 확인</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="비밀번호를 다시 입력하세요"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                className="h-12 px-4 pr-12 rounded-xl bg-secondary/50 border-0 focus:bg-background focus:ring-2 focus:ring-primary"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* 비밀번호 체크 표시 */}
          {(formData.password || formData.confirmPassword) && (
            <div className="flex flex-wrap gap-3 text-sm">
              <div className={cn(
                "flex items-center gap-1.5",
                passwordChecks.length ? "text-green-600" : "text-muted-foreground"
              )}>
                <Check className={cn("h-4 w-4", !passwordChecks.length && "opacity-40")} />
                8자 이상
              </div>
              <div className={cn(
                "flex items-center gap-1.5",
                passwordChecks.match ? "text-green-600" : "text-muted-foreground"
              )}>
                <Check className={cn("h-4 w-4", !passwordChecks.match && "opacity-40")} />
                비밀번호 일치
              </div>
            </div>
          )}

          <div className="pt-2">
            <Button
              type="submit"
              className="w-full h-12 rounded-xl text-base font-semibold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  가입 중...
                </>
              ) : (
                "회원가입"
              )}
            </Button>
          </div>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <span className="text-muted-foreground">이미 계정이 있으신가요? </span>
          <Link href="/login" className="text-primary font-semibold hover:underline">
            로그인
          </Link>
        </div>
      </div>
    </div>
  )
}
