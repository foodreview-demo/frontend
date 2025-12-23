"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { ko, en, type TranslationKeys, type Locale, defaultLocale } from './i18n'

const translations: Record<Locale, TranslationKeys> = { ko, en }

interface I18nContextType {
  locale: Locale
  t: TranslationKeys
  setLocale: (locale: Locale) => void
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

const LOCALE_STORAGE_KEY = 'app-locale'

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale)
  const [isInitialized, setIsInitialized] = useState(false)

  // 초기 로드 시 저장된 언어 설정 불러오기
  useEffect(() => {
    const savedLocale = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null
    if (savedLocale && (savedLocale === 'ko' || savedLocale === 'en')) {
      setLocaleState(savedLocale)
    }
    setIsInitialized(true)
  }, [])

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem(LOCALE_STORAGE_KEY, newLocale)
    // HTML lang 속성 업데이트
    document.documentElement.lang = newLocale
  }, [])

  const t = translations[locale]

  // 초기화 전에는 기본 언어로 렌더링 (hydration mismatch 방지)
  if (!isInitialized) {
    return (
      <I18nContext.Provider value={{ locale: defaultLocale, t: translations[defaultLocale], setLocale }}>
        {children}
      </I18nContext.Provider>
    )
  }

  return (
    <I18nContext.Provider value={{ locale, t, setLocale }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (context === undefined) {
    throw new Error('useI18n은 I18nProvider 내부에서 사용해야 합니다')
  }
  return context
}

// 편의 훅: 번역 객체만 반환
export function useTranslation() {
  const { t } = useI18n()
  return t
}
