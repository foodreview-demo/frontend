"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Eye, EyeOff, Lock, Mail, Shield } from "lucide-react"
import { MobileLayout } from "@/components/mobile-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"

export default function PrivacyPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()

  const [privacySettings, setPrivacySettings] = useState({
    profilePublic: true,
    showRegion: true,
    showReviews: true,
    allowMessages: true,
  })

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handlePasswordChange = async () => {
    if (!passwordForm.currentPassword) {
      toast({ title: "현재 비밀번호를 입력해주세요", variant: "destructive" })
      return
    }
    if (passwordForm.newPassword.length < 8) {
      toast({ title: "새 비밀번호는 8자 이상이어야 합니다", variant: "destructive" })
      return
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({ title: "새 비밀번호가 일치하지 않습니다", variant: "destructive" })
      return
    }

    setIsLoading(true)
    try {
      // TODO: API 연동 - 비밀번호 변경
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast({ title: "비밀번호가 변경되었습니다" })
      setIsPasswordDialogOpen(false)
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
    } catch (error) {
      toast({ title: "비밀번호 변경에 실패했습니다", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrivacySettingChange = (key: keyof typeof privacySettings, value: boolean) => {
    setPrivacySettings(prev => ({ ...prev, [key]: value }))
    // TODO: API 연동 - 개인정보 설정 저장
    toast({ title: "설정이 저장되었습니다" })
  }

  return (
    <MobileLayout hideNavigation>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">개인정보 및 보안</h1>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Account Info */}
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-2 px-1">계정 정보</h2>
          <Card className="divide-y divide-border">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">이메일</p>
                  <p className="text-sm text-muted-foreground">{user?.email || "email@example.com"}</p>
                </div>
              </div>
            </div>
            <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
              <DialogTrigger asChild>
                <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Lock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">비밀번호 변경</p>
                      <p className="text-sm text-muted-foreground">정기적으로 비밀번호를 변경해주세요</p>
                    </div>
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>비밀번호 변경</DialogTitle>
                  <DialogDescription>
                    새로운 비밀번호를 입력해주세요. 비밀번호는 8자 이상이어야 합니다.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>현재 비밀번호</Label>
                    <div className="relative">
                      <Input
                        type={showPasswords.current ? "text" : "password"}
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                        placeholder="현재 비밀번호"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                      >
                        {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>새 비밀번호</Label>
                    <div className="relative">
                      <Input
                        type={showPasswords.new ? "text" : "password"}
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                        placeholder="새 비밀번호 (8자 이상)"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                      >
                        {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>새 비밀번호 확인</Label>
                    <div className="relative">
                      <Input
                        type={showPasswords.confirm ? "text" : "password"}
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="새 비밀번호 확인"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                      >
                        {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
                    취소
                  </Button>
                  <Button onClick={handlePasswordChange} disabled={isLoading}>
                    {isLoading ? "변경 중..." : "변경"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </Card>
        </div>

        {/* Privacy Settings */}
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-2 px-1">공개 설정</h2>
          <Card className="divide-y divide-border">
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">프로필 공개</p>
                <p className="text-sm text-muted-foreground">다른 사용자가 내 프로필을 볼 수 있습니다</p>
              </div>
              <Switch
                checked={privacySettings.profilePublic}
                onCheckedChange={(checked) => handlePrivacySettingChange('profilePublic', checked)}
              />
            </div>
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">지역 표시</p>
                <p className="text-sm text-muted-foreground">프로필에 활동 지역을 표시합니다</p>
              </div>
              <Switch
                checked={privacySettings.showRegion}
                onCheckedChange={(checked) => handlePrivacySettingChange('showRegion', checked)}
              />
            </div>
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">리뷰 공개</p>
                <p className="text-sm text-muted-foreground">내가 작성한 리뷰를 다른 사용자가 볼 수 있습니다</p>
              </div>
              <Switch
                checked={privacySettings.showReviews}
                onCheckedChange={(checked) => handlePrivacySettingChange('showReviews', checked)}
              />
            </div>
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">메시지 허용</p>
                <p className="text-sm text-muted-foreground">다른 사용자가 메시지를 보낼 수 있습니다</p>
              </div>
              <Switch
                checked={privacySettings.allowMessages}
                onCheckedChange={(checked) => handlePrivacySettingChange('allowMessages', checked)}
              />
            </div>
          </Card>
        </div>

        {/* Security Info */}
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-2 px-1">보안 정보</h2>
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">로그인 보안</p>
                <p className="text-sm text-muted-foreground mt-1">
                  이 앱은 JWT(JSON Web Token) 기반 인증을 사용합니다.
                  로그인 정보는 기기에 안전하게 저장되며, 24시간 후 자동으로 갱신됩니다.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  공용 기기에서 사용 시 반드시 로그아웃해주세요.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Data Management */}
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-2 px-1">데이터 관리</h2>
          <Card className="divide-y divide-border">
            <button
              className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors text-left"
              onClick={() => {
                // TODO: 데이터 다운로드 기능
                toast({ title: "데이터 다운로드 요청이 접수되었습니다. 이메일로 전송됩니다." })
              }}
            >
              <div>
                <p className="font-medium">내 데이터 다운로드</p>
                <p className="text-sm text-muted-foreground">작성한 리뷰, 프로필 정보를 다운로드합니다</p>
              </div>
            </button>
            <button
              className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors text-left"
              onClick={() => {
                // 로컬 캐시 삭제
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('user')
                  toast({ title: "캐시가 삭제되었습니다" })
                }
              }}
            >
              <div>
                <p className="font-medium">캐시 삭제</p>
                <p className="text-sm text-muted-foreground">로컬에 저장된 캐시 데이터를 삭제합니다</p>
              </div>
            </button>
          </Card>
        </div>
      </div>
    </MobileLayout>
  )
}
