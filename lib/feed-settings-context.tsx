"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

interface FeedSettingsContextType {
  showVerifiedOnly: boolean
  setShowVerifiedOnly: (value: boolean) => void
  showFollowingOnly: boolean
  setShowFollowingOnly: (value: boolean) => void
}

// 기본값을 제공하여 Provider 없이도 안전하게 사용 가능
const defaultValue: FeedSettingsContextType = {
  showVerifiedOnly: false,
  setShowVerifiedOnly: () => {},
  showFollowingOnly: false,
  setShowFollowingOnly: () => {},
}

const FeedSettingsContext = createContext<FeedSettingsContextType>(defaultValue)

const STORAGE_KEY = "feedSettings"

export function FeedSettingsProvider({ children }: { children: ReactNode }) {
  const [showVerifiedOnly, setShowVerifiedOnlyState] = useState(false)
  const [showFollowingOnly, setShowFollowingOnlyState] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  // localStorage에서 설정 로드
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        try {
          const settings = JSON.parse(stored)
          setShowVerifiedOnlyState(settings.showVerifiedOnly ?? false)
          setShowFollowingOnlyState(settings.showFollowingOnly ?? false)
        } catch {
          // 파싱 실패 시 기본값 유지
        }
      }
      setIsLoaded(true)
    }
  }, [])

  // localStorage에 설정 저장 (공통 함수)
  const saveSettings = (verifiedOnly: boolean, followingOnly: boolean) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        showVerifiedOnly: verifiedOnly,
        showFollowingOnly: followingOnly,
      }))
    }
  }

  // 설정 변경 시 localStorage에 저장
  const setShowVerifiedOnly = (value: boolean) => {
    setShowVerifiedOnlyState(value)
    saveSettings(value, showFollowingOnly)
  }

  const setShowFollowingOnly = (value: boolean) => {
    setShowFollowingOnlyState(value)
    saveSettings(showVerifiedOnly, value)
  }

  // 로드 전에는 기본값 반환
  if (!isLoaded) {
    return (
      <FeedSettingsContext.Provider value={{
        showVerifiedOnly: false,
        setShowVerifiedOnly,
        showFollowingOnly: false,
        setShowFollowingOnly,
      }}>
        {children}
      </FeedSettingsContext.Provider>
    )
  }

  return (
    <FeedSettingsContext.Provider value={{
      showVerifiedOnly,
      setShowVerifiedOnly,
      showFollowingOnly,
      setShowFollowingOnly,
    }}>
      {children}
    </FeedSettingsContext.Provider>
  )
}

export function useFeedSettings() {
  return useContext(FeedSettingsContext)
}
