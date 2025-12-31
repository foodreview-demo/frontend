"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

interface FeedSettingsContextType {
  showVerifiedOnly: boolean
  setShowVerifiedOnly: (value: boolean) => void
}

// 기본값을 제공하여 Provider 없이도 안전하게 사용 가능
const defaultValue: FeedSettingsContextType = {
  showVerifiedOnly: false,
  setShowVerifiedOnly: () => {},
}

const FeedSettingsContext = createContext<FeedSettingsContextType>(defaultValue)

const STORAGE_KEY = "feedSettings"

export function FeedSettingsProvider({ children }: { children: ReactNode }) {
  const [showVerifiedOnly, setShowVerifiedOnlyState] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  // localStorage에서 설정 로드
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        try {
          const settings = JSON.parse(stored)
          setShowVerifiedOnlyState(settings.showVerifiedOnly ?? false)
        } catch {
          // 파싱 실패 시 기본값 유지
        }
      }
      setIsLoaded(true)
    }
  }, [])

  // 설정 변경 시 localStorage에 저장
  const setShowVerifiedOnly = (value: boolean) => {
    setShowVerifiedOnlyState(value)
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ showVerifiedOnly: value }))
    }
  }

  // 로드 전에는 기본값 반환
  if (!isLoaded) {
    return (
      <FeedSettingsContext.Provider value={{ showVerifiedOnly: false, setShowVerifiedOnly }}>
        {children}
      </FeedSettingsContext.Provider>
    )
  }

  return (
    <FeedSettingsContext.Provider value={{ showVerifiedOnly, setShowVerifiedOnly }}>
      {children}
    </FeedSettingsContext.Provider>
  )
}

export function useFeedSettings() {
  return useContext(FeedSettingsContext)
}
