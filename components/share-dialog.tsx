"use client"

import { useState, useEffect } from "react"
import Script from "next/script"
import { Copy, Check, MessageCircle, Link2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface ShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  restaurant: {
    id: number
    uuid: string
    name: string
    address: string
    category?: string
    categoryDisplay?: string
    averageRating?: number
    thumbnail?: string
  }
}

const KAKAO_APP_KEY = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID

export function ShareDialog({ open, onOpenChange, restaurant }: ShareDialogProps) {
  const [copied, setCopied] = useState(false)
  const [kakaoReady, setKakaoReady] = useState(false)

  // 현재 페이지 URL (UUID 기반)
  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/restaurant/${restaurant.uuid}`
    : ""

  // 카카오 SDK 초기화 체크
  useEffect(() => {
    const kakao = (window as any).Kakao
    if (kakao) {
      if (!kakao.isInitialized() && KAKAO_APP_KEY) {
        kakao.init(KAKAO_APP_KEY)
      }
      setKakaoReady(true)
    }
  }, [])

  const handleKakaoShare = () => {
    const kakao = (window as any).Kakao
    if (!kakao || !kakao.Share) {
      toast.error("카카오톡 공유 기능을 불러오지 못했습니다")
      return
    }

    kakao.Share.sendDefault({
      objectType: "location",
      address: restaurant.address,
      addressTitle: restaurant.name,
      content: {
        title: restaurant.name,
        description: `${restaurant.categoryDisplay || restaurant.category || "맛집"} | ⭐ ${restaurant.averageRating || 0}점`,
        imageUrl: restaurant.thumbnail || `${window.location.origin}/placeholder.svg`,
        link: {
          mobileWebUrl: shareUrl,
          webUrl: shareUrl,
        },
      },
      buttons: [
        {
          title: "자세히 보기",
          link: {
            mobileWebUrl: shareUrl,
            webUrl: shareUrl,
          },
        },
      ],
    })

    onOpenChange(false)
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast.success("링크가 복사되었습니다")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea")
      textArea.value = shareUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
      setCopied(true)
      toast.success("링크가 복사되었습니다")
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: restaurant.name,
          text: `${restaurant.name} - ${restaurant.address}`,
          url: shareUrl,
        })
        onOpenChange(false)
      } catch (err) {
        // User cancelled or error
        if ((err as Error).name !== "AbortError") {
          toast.error("공유에 실패했습니다")
        }
      }
    }
  }

  return (
    <>
      {/* 카카오 SDK 스크립트 */}
      <Script
        src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js"
        integrity="sha384-DKYJZ8NLiK8MN4/C5P2dtSmLQ4KwPaoqAfyA/DfmEc1VDxu4yyC7wy6K1Ber2m1s"
        crossOrigin="anonymous"
        onLoad={() => {
          const kakao = (window as any).Kakao
          if (kakao && !kakao.isInitialized() && KAKAO_APP_KEY) {
            kakao.init(KAKAO_APP_KEY)
          }
          setKakaoReady(true)
        }}
      />

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-center">공유하기</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3 py-4">
            {/* 카카오톡 공유 */}
            <Button
              variant="outline"
              className="flex flex-col items-center gap-2 h-auto py-4"
              onClick={handleKakaoShare}
              disabled={!kakaoReady}
            >
              <div className="w-12 h-12 rounded-full bg-[#FEE500] flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-[#3C1E1E]" />
              </div>
              <span className="text-sm">카카오톡</span>
            </Button>

            {/* 링크 복사 */}
            <Button
              variant="outline"
              className="flex flex-col items-center gap-2 h-auto py-4"
              onClick={handleCopyLink}
            >
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                {copied ? (
                  <Check className="w-6 h-6 text-green-500" />
                ) : (
                  <Link2 className="w-6 h-6 text-gray-600" />
                )}
              </div>
              <span className="text-sm">{copied ? "복사됨" : "링크 복사"}</span>
            </Button>
          </div>

          {/* 네이티브 공유 (모바일) */}
          {typeof window !== "undefined" && "share" in navigator && (
            <Button
              variant="secondary"
              className="w-full"
              onClick={handleNativeShare}
            >
              <Copy className="w-4 h-4 mr-2" />
              다른 앱으로 공유
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
