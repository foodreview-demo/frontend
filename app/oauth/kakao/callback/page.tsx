"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Loader2 } from "lucide-react"
import { api } from "@/lib/api"

function KakaoCallbackContent() {
  const router = useRouter()
  const { loginWithKakao } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [showAppButton, setShowAppButton] = useState(false)
  const [appRedirectUrl, setAppRedirectUrl] = useState<string | null>(null)
  const processedRef = useRef(false)

  useEffect(() => {
    // 중복 요청 방지 (StrictMode에서 2번 실행 방지)
    if (processedRef.current) return

    // Static Export 환경에서 useSearchParams 대신 window.location.search 직접 사용
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    const errorParam = urlParams.get('error')

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
        // 직접 API 호출하여 토큰 받기
        const result = await api.loginWithKakao(code)

        if (result.success) {
          const { accessToken, refreshToken } = result.data

          // 외부 브라우저에서 열렸는지 확인 (앱에서 온 경우)
          // User-Agent나 referrer로는 판단하기 어려우므로, 앱으로 돌아가는 버튼 표시
          const appUrl = `matjalal://callback?token=${encodeURIComponent(accessToken)}&refreshToken=${encodeURIComponent(refreshToken)}`
          setAppRedirectUrl(appUrl)

          // 자동으로 앱 열기 시도
          window.location.href = appUrl

          // 2초 후에도 여기 있으면 (앱이 안 열렸으면) 웹으로 처리
          setTimeout(() => {
            // 아직 이 페이지에 있으면 웹 브라우저에서 열린 것
            setShowAppButton(true)
            // 웹에서는 그냥 홈으로 이동
            router.push('/')
          }, 2000)
        } else {
          throw new Error(result.message || '카카오 로그인 실패')
        }
      } catch (err) {
        console.error('카카오 로그인 실패:', err)
        setError(err instanceof Error ? err.message : '카카오 로그인에 실패했습니다')
        setTimeout(() => router.push('/login'), 3000)
      }
    }

    handleLogin()
  }, [router])

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

export default function KakaoCallbackPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center max-w-md mx-auto px-6">
      <KakaoCallbackContent />
    </div>
  )
}
