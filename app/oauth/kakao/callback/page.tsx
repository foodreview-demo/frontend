"use client"

import { Suspense, useEffect, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Loader2 } from "lucide-react"

function KakaoCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { loginWithKakao } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const processedRef = useRef(false)

  useEffect(() => {
    // 중복 요청 방지 (StrictMode에서 2번 실행 방지)
    if (processedRef.current) return

    const code = searchParams.get('code')
    const errorParam = searchParams.get('error')

    if (errorParam) {
      setError('카카오 로그인이 취소되었습니다')
      setTimeout(() => router.push('/login'), 2000)
      return
    }

    if (!code) {
      setError('인증 코드가 없습니다')
      setTimeout(() => router.push('/login'), 2000)
      return
    }

    processedRef.current = true

    const handleLogin = async () => {
      try {
        await loginWithKakao(code)
        router.push('/')
      } catch (err) {
        console.error('카카오 로그인 실패:', err)
        setError(err instanceof Error ? err.message : '카카오 로그인에 실패했습니다')
        setTimeout(() => router.push('/login'), 3000)
      }
    }

    handleLogin()
  }, [searchParams, loginWithKakao, router])

  return (
    <div className="text-center">
      {error ? (
        <>
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
            <span className="text-3xl">😢</span>
          </div>
          <h1 className="text-xl font-bold text-foreground mb-2">로그인 실패</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <p className="text-sm text-muted-foreground">로그인 페이지로 이동합니다...</p>
        </>
      ) : (
        <>
          <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-6">
            <Loader2 className="w-8 h-8 animate-spin text-yellow-600" />
          </div>
          <h1 className="text-xl font-bold text-foreground mb-2">카카오 로그인 중</h1>
          <p className="text-muted-foreground">잠시만 기다려주세요...</p>
        </>
      )}
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-6">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-600" />
      </div>
      <h1 className="text-xl font-bold text-foreground mb-2">로딩 중</h1>
      <p className="text-muted-foreground">잠시만 기다려주세요...</p>
    </div>
  )
}

export default function KakaoCallbackPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center max-w-md mx-auto px-6">
      <Suspense fallback={<LoadingFallback />}>
        <KakaoCallbackContent />
      </Suspense>
    </div>
  )
}
