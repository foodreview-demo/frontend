"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api, User } from './api'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
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
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        setUser(null)
        const publicPaths = ['/login', '/signup']
        const isPublicPath = publicPaths.some(path => window.location.pathname.startsWith(path))
        if (typeof window !== 'undefined' && !isPublicPath) {
          window.location.href = '/login'
        }
        return
      }

      const result = await api.getMe()
      if (result.success) {
        setUser(result.data)
        localStorage.setItem('user', JSON.stringify(result.data))
      } else {
        // 토큰이 유효하지 않으면 로그아웃 처리 및 로그인 페이지로 이동
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        setUser(null)
        const publicPaths = ['/login', '/signup']
        const isPublicPath = publicPaths.some(path => window.location.pathname.startsWith(path))
        if (typeof window !== 'undefined' && !isPublicPath) {
          window.location.href = '/login'
        }
      }
    } catch (error) {
      console.error('사용자 정보 로드 실패:', error)
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      setUser(null)
      const publicPaths = ['/login', '/signup']
      const isPublicPath = publicPaths.some(path => window.location.pathname.startsWith(path))
      if (typeof window !== 'undefined' && !isPublicPath) {
        window.location.href = '/login'
      }
    }
  }, [])

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true)
      try {
        // 로컬스토리지에서 캐시된 사용자 정보 로드
        const cachedUser = localStorage.getItem('user')
        if (cachedUser) {
          setUser(JSON.parse(cachedUser))
        }

        // 서버에서 최신 정보 가져오기
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
    // 로그인 전 기존 캐시 클리어
    localStorage.removeItem('user')
    setUser(null)

    const result = await api.login(email, password)
    if (result.success) {
      await refreshUser()
    } else {
      throw new Error(result.message || '로그인 실패')
    }
  }

  const signUp = async (data: { email: string; password: string; name: string; region: string }) => {
    const result = await api.signUp(data)
    if (!result.success) {
      throw new Error(result.message || '회원가입 실패')
    }
  }

  const logout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    setUser(null)
  }

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
