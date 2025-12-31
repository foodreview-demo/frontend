"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  User,
  Bell,
  Shield,
  LogOut,
  Trash2,
  ChevronRight,
  Globe,
  Check,
  Settings2,
  UserX,
  Receipt,
  Filter
} from "lucide-react"
import { MobileLayout } from "@/components/mobile-layout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useAuth } from "@/lib/auth-context"
import { useI18n } from "@/lib/i18n-context"
import { locales, type Locale } from "@/lib/i18n"
import { useFeedSettings } from "@/lib/feed-settings-context"

export default function SettingsPage() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const { locale, setLocale, t } = useI18n()
  const { showVerifiedOnly, setShowVerifiedOnly } = useFeedSettings()
  const [notifications, setNotifications] = useState({
    reviews: true,
    follows: true,
    messages: true,
    marketing: false,
  })
  const [showLanguageSelect, setShowLanguageSelect] = useState(false)

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const handleDeleteAccount = () => {
    // TODO: API 연동 - 계정 삭제
    logout()
    router.push("/login")
  }

  const handleLanguageChange = (newLocale: Locale) => {
    setLocale(newLocale)
    setShowLanguageSelect(false)
  }

  const currentLocaleName = locales.find(l => l.code === locale)?.nativeName || locale

  return (
    <MobileLayout hideNavigation>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">{t.settings.title}</h1>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Account Section */}
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-2 px-1">{t.settings.account}</h2>
          <Card className="divide-y divide-border">
            <Link href="/settings/profile">
              <div className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">{t.settings.editProfile}</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </Link>
            <Link href="/settings/privacy">
              <div className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">{t.settings.privacySecurity}</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </Link>
            <Link href="/settings/blocked">
              <div className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors">
                <div className="flex items-center gap-3">
                  <UserX className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">차단 관리</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </Link>
            {user?.role === 'ADMIN' && (
              <Link href="/admin">
                <div className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Settings2 className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">관리자 페이지</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </Link>
            )}
          </Card>
        </div>

        {/* Language Section */}
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-2 px-1">{t.settings.language}</h2>
          <Card className="divide-y divide-border">
            <div
              className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors cursor-pointer"
              onClick={() => setShowLanguageSelect(!showLanguageSelect)}
            >
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{t.settings.language}</p>
                  <p className="text-sm text-muted-foreground">{t.settings.languageDesc}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{currentLocaleName}</span>
                <ChevronRight className={`h-5 w-5 text-muted-foreground transition-transform ${showLanguageSelect ? 'rotate-90' : ''}`} />
              </div>
            </div>
            {showLanguageSelect && (
              <div className="p-2 space-y-1">
                {locales.map((loc) => (
                  <div
                    key={loc.code}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                      locale === loc.code ? 'bg-primary/10' : 'hover:bg-secondary/50'
                    }`}
                    onClick={() => handleLanguageChange(loc.code)}
                  >
                    <span className={locale === loc.code ? 'font-medium text-primary' : ''}>
                      {loc.nativeName}
                    </span>
                    {locale === loc.code && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Feed Settings Section */}
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-2 px-1">피드 설정</h2>
          <Card className="divide-y divide-border">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Receipt className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">인증된 리뷰만 보기</p>
                  <p className="text-sm text-muted-foreground">영수증 인증이 완료된 리뷰만 표시합니다</p>
                </div>
              </div>
              <Switch
                checked={showVerifiedOnly}
                onCheckedChange={setShowVerifiedOnly}
              />
            </div>
          </Card>
        </div>

        {/* Notifications Section */}
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-2 px-1">{t.settings.notifications}</h2>
          <Card className="divide-y divide-border">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{t.settings.reviewNotification}</p>
                  <p className="text-sm text-muted-foreground">{t.settings.reviewNotificationDesc}</p>
                </div>
              </div>
              <Switch
                checked={notifications.reviews}
                onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, reviews: checked }))}
              />
            </div>
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{t.settings.followNotification}</p>
                  <p className="text-sm text-muted-foreground">{t.settings.followNotificationDesc}</p>
                </div>
              </div>
              <Switch
                checked={notifications.follows}
                onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, follows: checked }))}
              />
            </div>
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{t.settings.messageNotification}</p>
                  <p className="text-sm text-muted-foreground">{t.settings.messageNotificationDesc}</p>
                </div>
              </div>
              <Switch
                checked={notifications.messages}
                onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, messages: checked }))}
              />
            </div>
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{t.settings.marketingNotification}</p>
                  <p className="text-sm text-muted-foreground">{t.settings.marketingNotificationDesc}</p>
                </div>
              </div>
              <Switch
                checked={notifications.marketing}
                onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, marketing: checked }))}
              />
            </div>
          </Card>
        </div>

        {/* App Info Section */}
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-2 px-1">{t.settings.appInfo}</h2>
          <Card className="divide-y divide-border">
            <div className="flex items-center justify-between p-4">
              <span className="font-medium">{t.common.version}</span>
              <span className="text-muted-foreground">1.0.0</span>
            </div>
            <Link href="/terms">
              <div className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors">
                <span className="font-medium">{t.settings.terms}</span>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </Link>
            <Link href="/privacy-policy">
              <div className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors">
                <span className="font-medium">{t.settings.privacyPolicy}</span>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </Link>
          </Card>
        </div>

        {/* Logout & Delete */}
        <div className="space-y-3 pt-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="w-full justify-start gap-3">
                <LogOut className="h-5 w-5" />
                {t.auth.logout}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t.auth.logout}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t.auth.logoutConfirm}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                <AlertDialogAction onClick={handleLogout}>{t.auth.logout}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10">
                <Trash2 className="h-5 w-5" />
                {t.settings.deleteAccount}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t.settings.deleteAccount}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t.settings.deleteAccountConfirm}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {t.common.delete}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </MobileLayout>
  )
}
