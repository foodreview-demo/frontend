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
  Moon,
  Sun
} from "lucide-react"
import { MobileLayout } from "@/components/mobile-layout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
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

export default function SettingsPage() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [notifications, setNotifications] = useState({
    reviews: true,
    follows: true,
    messages: true,
    marketing: false,
  })

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const handleDeleteAccount = () => {
    // TODO: API 연동 - 계정 삭제
    logout()
    router.push("/")
  }

  return (
    <MobileLayout hideNavigation>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">설정</h1>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Account Section */}
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-2 px-1">계정</h2>
          <Card className="divide-y divide-border">
            <Link href="/settings/profile">
              <div className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">프로필 수정</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </Link>
            <Link href="/settings/privacy">
              <div className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">개인정보 및 보안</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </Link>
          </Card>
        </div>

        {/* Notifications Section */}
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-2 px-1">알림</h2>
          <Card className="divide-y divide-border">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">리뷰 알림</p>
                  <p className="text-sm text-muted-foreground">내 리뷰에 공감이 달리면 알림</p>
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
                  <p className="font-medium">친구 추가 알림</p>
                  <p className="text-sm text-muted-foreground">새로운 친구가 추가되면 알림</p>
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
                  <p className="font-medium">메시지 알림</p>
                  <p className="text-sm text-muted-foreground">새 메시지가 오면 알림</p>
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
                  <p className="font-medium">마케팅 알림</p>
                  <p className="text-sm text-muted-foreground">이벤트, 프로모션 정보 수신</p>
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
          <h2 className="text-sm font-medium text-muted-foreground mb-2 px-1">앱 정보</h2>
          <Card className="divide-y divide-border">
            <div className="flex items-center justify-between p-4">
              <span className="font-medium">버전</span>
              <span className="text-muted-foreground">1.0.0</span>
            </div>
            <Link href="/terms">
              <div className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors">
                <span className="font-medium">이용약관</span>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </Link>
            <Link href="/privacy-policy">
              <div className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors">
                <span className="font-medium">개인정보처리방침</span>
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
                로그아웃
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>로그아웃</AlertDialogTitle>
                <AlertDialogDescription>
                  정말 로그아웃 하시겠습니까?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction onClick={handleLogout}>로그아웃</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10">
                <Trash2 className="h-5 w-5" />
                계정 삭제
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>계정 삭제</AlertDialogTitle>
                <AlertDialogDescription>
                  정말 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없으며, 모든 리뷰와 데이터가 영구적으로 삭제됩니다.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  삭제
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </MobileLayout>
  )
}
