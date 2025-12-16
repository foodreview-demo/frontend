"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api, User } from './api'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  loginWithKakao: (code: string) => Promise<void>
  signUp: (data: { email: string; password: string; name: string; region: string }) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
  updateProfile: (data: { name?: string; avatar?: string; region?: string; favoriteCategories?: string[] }) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    // accessToken이 없는 경우
    if (!api.hasAccessToken()) {
      // refreshToken이 있으면 토큰 갱신 시도
      if (api.hasRefreshToken()) {
        console.log('No access token, attempting refresh...')
        const refreshed = await api.tryRefreshToken()
        if (!refreshed) {
          // 갱신 실패 시 로그아웃 상태
          setUser(null)
          localStorage.removeItem('user')
          setIsLoading(false)
          return
        }
        // 갱신 성공 시 계속 진행
        console.log('Token refreshed, fetching user info...')
      } else {
        // refreshToken도 없으면 로그아웃 상태
        setUser(null)
        localStorage.removeItem('user')
        setIsLoading(false)
        return
      }
    }

    try {
      const result = await api.getMe()
      if (result.success) {
        setUser(result.data)
        localStorage.setItem('user', JSON.stringify(result.data))
      } else {
        // 서버에서 사용자 정보 가져오기 실패 (토큰 만료 등)
        setUser(null)
        localStorage.removeItem('user')
      }
    } catch (error) {
      console.error('사용자 정보 로드 실패:', error)
      setUser(null)
      localStorage.removeItem('user')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true)
      try {
        // 로컬스토리지에서 캐시된 사용자 정보 로드 (SSR 환경에서는 쿠키에서 처리되므로 클라이언트 캐시 용도)
        const cachedUser = localStorage.getItem('user')
        if (cachedUser) {
          setUser(JSON.parse(cachedUser))
        }

        // 서버에서 최신 정보 가져오기 (쿠키 기반 인증으로 변경)
        await refreshUser()
      } catch (error) {
        console.error('인증 초기화 실패:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [refreshUser])

  const login = async (email: string, password: string) => {
    localStorage.removeItem('user')
    setUser(null)
    const result = await api.login(email, password)
    if (result.success) {
      await refreshUser()
    } else {
      throw new Error(result.message || '로그인 실패')
    }
  }

  const loginWithKakao = async (code: string) => {
    localStorage.removeItem('user')
    setUser(null)
    const result = await api.loginWithKakao(code)
    if (result.success) {
      await refreshUser()
    } else {
      throw new Error(result.message || '카카오 로그인 실패')
    }
  }

  const signUp = async (data: { email: string; password: string; name: string; region: string }) => {
    const result = await api.signUp(data)
    if (!result.success) {
      throw new Error(result.message || '회원가입 실패')
    }
  }

  const logout = async () => {
    await api.logout(); // API 클라이언트의 로그아웃 함수 호출 (쿠키 삭제 및 리다이렉션 포함)
    setUser(null);
    localStorage.removeItem('user'); // 로컬스토리지 사용자 정보도 삭제
  };

  const updateProfile = async (data: { name?: string; avatar?: string; region?: string; favoriteCategories?: string[] }) => {
    const result = await api.updateProfile(data)
    if (result.success) {
      setUser(result.data)
      localStorage.setItem('user', JSON.stringify(result.data))
    } else {
      throw new Error(result.message || '프로필 수정 실패')
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        loginWithKakao,
        signUp,
        logout,
        refreshUser,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth는 AuthProvider 내부에서 사용해야 합니다')
  }
  return context
}

