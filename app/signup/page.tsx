"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useTranslation } from "@/lib/i18n-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Eye, EyeOff, Mail, Lock, User, MapPin, Check, ArrowLeft } from "lucide-react"
import { regions } from "@/lib/constants"
import { cn } from "@/lib/utils"

export default function SignUpPage() {
  const router = useRouter()
  const { signUp } = useAuth()
  const t = useTranslation()
  const [step, setStep] = useState(1)
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
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (formData.password !== formData.confirmPassword) {
      setError(t.auth.passwordMismatch)
      return
    }

    if (formData.password.length < 8) {
      setError(t.auth.passwordTooShort)
      return
    }

    if (!formData.region) {
      setError(t.auth.selectRegion)
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
      setError(err instanceof Error ? err.message : t.auth.signupFailed)
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

  // 스텝 1 유효성 (이메일, 닉네임)
  const isStep1Valid = formData.email.length > 0 && formData.name.length >= 2

  // 스텝 2 유효성 (비밀번호)
  const isStep2Valid = passwordChecks.length && passwordChecks.match

  const handleNextStep = () => {
    if (step === 1 && isStep1Valid) {
      setStep(2)
    }
  }

  const handlePrevStep = () => {
    if (step === 2) {
      setStep(1)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/20 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 max-w-md mx-auto w-full">

        {/* Progress Indicator */}
        <div className="w-full mb-8 animate-in fade-in duration-500">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className={cn(
              "w-3 h-3 rounded-full transition-all duration-300",
              step >= 1 ? "bg-primary scale-100" : "bg-muted scale-75"
            )} />
            <div className={cn(
              "w-12 h-1 rounded-full transition-all duration-500",
              step >= 2 ? "bg-primary" : "bg-muted"
            )} />
            <div className={cn(
              "w-3 h-3 rounded-full transition-all duration-300",
              step >= 2 ? "bg-primary scale-100" : "bg-muted scale-75"
            )} />
          </div>
          <p className="text-center text-sm text-muted-foreground">
            {step === 1 ? t.auth.basicInfo : t.auth.passwordSetup}
          </p>
        </div>

        {/* Header */}
        <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-[1.75rem] mb-5 shadow-xl shadow-primary/25">
            <span className="text-4xl">🍽️</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">{t.auth.signup}</h1>
          <p className="text-muted-foreground mt-2">{t.auth.joinCommunity}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-5 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-150">
          {error && (
            <div className="p-4 text-sm text-red-600 bg-red-50 dark:bg-red-950/50 rounded-2xl border border-red-100 dark:border-red-900 animate-in fade-in slide-in-from-top-2 duration-300">
              {error}
            </div>
          )}

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              {/* Email */}
              <div className={`relative transition-all duration-300 ${focusedField === 'email' ? 'scale-[1.02]' : ''}`}>
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Mail className="h-5 w-5" />
                </div>
                <Input
                  id="email"
                  type="email"
                  placeholder={t.auth.email}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  required
                  className="h-14 pl-12 pr-4 rounded-2xl bg-secondary/50 border-2 border-transparent focus:border-primary focus:bg-background transition-all duration-300 text-base"
                />
              </div>

              {/* Nickname */}
              <div className={`relative transition-all duration-300 ${focusedField === 'name' ? 'scale-[1.02]' : ''}`}>
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <User className="h-5 w-5" />
                </div>
                <Input
                  id="name"
                  type="text"
                  placeholder={t.auth.nicknamePlaceholder}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                  required
                  minLength={2}
                  maxLength={30}
                  className="h-14 pl-12 pr-4 rounded-2xl bg-secondary/50 border-2 border-transparent focus:border-primary focus:bg-background transition-all duration-300 text-base"
                />
              </div>

              {/* Region */}
              <div className={`relative transition-all duration-300 ${focusedField === 'region' ? 'scale-[1.02]' : ''}`}>
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground z-10 pointer-events-none">
                  <MapPin className="h-5 w-5" />
                </div>
                <Select
                  value={formData.region}
                  onValueChange={(value) => setFormData({ ...formData, region: value })}
                  onOpenChange={(open) => setFocusedField(open ? 'region' : null)}
                >
                  <SelectTrigger className="h-14 pl-12 pr-4 rounded-2xl bg-secondary/50 border-2 border-transparent focus:border-primary focus:bg-background transition-all duration-300 text-base [&>span]:text-left">
                    <SelectValue placeholder={t.common.selectRegion} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {availableRegions.map((region) => (
                      <SelectItem key={region} value={region} className="rounded-lg">
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Next Button */}
              <Button
                type="button"
                onClick={handleNextStep}
                disabled={!isStep1Valid}
                className="w-full h-14 rounded-2xl text-base font-semibold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/25 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:shadow-none disabled:translate-y-0"
              >
                {t.common.next}
              </Button>
            </div>
          )}

          {/* Step 2: Password */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              {/* Back Button */}
              <button
                type="button"
                onClick={handlePrevStep}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm">{t.common.back}</span>
              </button>

              {/* Password */}
              <div className={`relative transition-all duration-300 ${focusedField === 'password' ? 'scale-[1.02]' : ''}`}>
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Lock className="h-5 w-5" />
                </div>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t.auth.passwordMinLength}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  required
                  minLength={8}
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

              {/* Confirm Password */}
              <div className={`relative transition-all duration-300 ${focusedField === 'confirmPassword' ? 'scale-[1.02]' : ''}`}>
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Lock className="h-5 w-5" />
                </div>
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder={t.auth.passwordConfirm}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  onFocus={() => setFocusedField('confirmPassword')}
                  onBlur={() => setFocusedField(null)}
                  required
                  className="h-14 pl-12 pr-14 rounded-2xl bg-secondary/50 border-2 border-transparent focus:border-primary focus:bg-background transition-all duration-300 text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {/* Password Validation */}
              {(formData.password || formData.confirmPassword) && (
                <div className="flex flex-wrap gap-4 py-2 animate-in fade-in duration-300">
                  <div className={cn(
                    "flex items-center gap-2 transition-all duration-300",
                    passwordChecks.length ? "text-green-600" : "text-muted-foreground"
                  )}>
                    <div className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300",
                      passwordChecks.length ? "bg-green-100 dark:bg-green-900/30" : "bg-muted"
                    )}>
                      <Check className={cn("h-3 w-3", !passwordChecks.length && "opacity-40")} />
                    </div>
                    <span className="text-sm">{t.auth.minChars}</span>
                  </div>
                  <div className={cn(
                    "flex items-center gap-2 transition-all duration-300",
                    passwordChecks.match ? "text-green-600" : "text-muted-foreground"
                  )}>
                    <div className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300",
                      passwordChecks.match ? "bg-green-100 dark:bg-green-900/30" : "bg-muted"
                    )}>
                      <Check className={cn("h-3 w-3", !passwordChecks.match && "opacity-40")} />
                    </div>
                    <span className="text-sm">{t.auth.passwordMatch}</span>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading || !isStep2Valid}
                className="w-full h-14 rounded-2xl text-base font-semibold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/25 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:shadow-none disabled:translate-y-0"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  t.auth.signupComplete
                )}
              </Button>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="mt-10 text-center animate-in fade-in duration-700 delay-300">
          <p className="text-muted-foreground">
            {t.auth.hasAccount}{" "}
            <Link href="/login" className="text-primary font-semibold hover:underline underline-offset-4">
              {t.auth.login}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
