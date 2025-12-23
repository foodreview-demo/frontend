"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "@/lib/i18n-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Eye, EyeOff, Mail, Lock } from "lucide-react"

const KAKAO_CLIENT_ID = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID
const KAKAO_REDIRECT_URI = process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI || 'http://localhost:3000/oauth/kakao/callback'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const t = useTranslation()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const handleKakaoLogin = () => {
    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${encodeURIComponent(KAKAO_REDIRECT_URI)}&response_type=code`
    window.location.href = kakaoAuthUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      await login(email, password)
      router.push("/")
    } catch (err) {
      setError(err instanceof Error ? err.message : t.auth.loginFailed)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/20 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 max-w-md mx-auto w-full">

        {/* Logo & Branding */}
        <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="relative inline-block mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-primary to-primary/80 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-primary/30 transform hover:scale-105 transition-transform duration-300">
              <span className="text-5xl">🍽️</span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-4 border-background">
              <span className="text-xs">✓</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-foreground tracking-tight">{t.common.appName}</h1>
          <p className="text-muted-foreground mt-2 text-lg">{t.auth.appSlogan}</p>
        </div>

        {/* Form Card */}
        <div className="w-full animate-in fade-in slide-in-from-bottom-6 duration-700 delay-150">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-4 text-sm text-red-600 bg-red-50 dark:bg-red-950/50 rounded-2xl border border-red-100 dark:border-red-900 animate-in fade-in slide-in-from-top-2 duration-300">
                {error}
              </div>
            )}

            {/* Email Input */}
            <div className={`relative transition-all duration-300 ${focusedField === 'email' ? 'scale-[1.02]' : ''}`}>
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Mail className="h-5 w-5" />
              </div>
              <Input
                id="email"
                type="email"
                placeholder={t.auth.email}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                required
                className="h-14 pl-12 pr-4 rounded-2xl bg-secondary/50 border-2 border-transparent focus:border-primary focus:bg-background transition-all duration-300 text-base"
              />
            </div>

            {/* Password Input */}
            <div className={`relative transition-all duration-300 ${focusedField === 'password' ? 'scale-[1.02]' : ''}`}>
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Lock className="h-5 w-5" />
              </div>
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder={t.auth.password}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                required
                className="h-14 pl-12 pr-14 rounded-2xl bg-secondary/50 border-2 border-transparent focus:border-primary focus:bg-background transition-all duration-300 text-base"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              className="w-full h-14 rounded-2xl text-base font-semibold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/25 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-0.5"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                t.auth.login
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-gradient-to-b from-background to-secondary/20 text-sm text-muted-foreground">
                {t.auth.quickLogin}
              </span>
            </div>
          </div>

          {/* Social Login */}
          <button
            type="button"
            onClick={handleKakaoLogin}
            className="w-full h-14 rounded-2xl text-base font-semibold flex items-center justify-center gap-3 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
            style={{ backgroundColor: '#FEE500', color: '#000000' }}
          >
            <svg width="22" height="22" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M10 2C5.029 2 1 5.129 1 8.989C1 11.389 2.558 13.505 4.932 14.764L3.933 18.256C3.845 18.561 4.213 18.806 4.477 18.62L8.601 15.898C9.057 15.952 9.523 15.98 10 15.98C14.971 15.98 19 12.851 19 8.991C19 5.131 14.971 2.002 10 2.002V2Z" fill="black"/>
            </svg>
            {t.auth.loginWithKakao}
          </button>
        </div>

        {/* Footer Links */}
        <div className="mt-12 text-center animate-in fade-in duration-700 delay-300">
          <p className="text-muted-foreground">
            {t.auth.noAccount}{" "}
            <Link href="/signup" className="text-primary font-semibold hover:underline underline-offset-4">
              {t.auth.signup}
            </Link>
          </p>
        </div>

        {/* Test Account Info */}
        <div className="mt-8 w-full animate-in fade-in duration-700 delay-500">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-gradient-to-b from-background to-secondary/20 text-xs text-muted-foreground">
                {t.auth.testAccount}
              </span>
            </div>
          </div>
          <div className="mt-4 text-center text-sm text-muted-foreground bg-secondary/30 rounded-2xl p-4 backdrop-blur-sm">
            <p className="font-mono text-foreground">user1@foodreview.com</p>
            <p className="font-mono text-xs mt-1">password123</p>
          </div>
        </div>
      </div>
    </div>
  )
}
