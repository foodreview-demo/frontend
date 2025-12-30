'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, AlertTriangle, Users, FileText, CheckCircle, XCircle, Trash2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { useAuth } from '@/lib/auth-context'
import { api, type Report, type AdminStats, type ReportStatus, REPORT_STATUS_LABELS } from '@/lib/api'
import { formatRelativeTime } from '@/lib/constants'

export default function AdminPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [reports, setReports] = useState<Report[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<ReportStatus | 'ALL'>('PENDING')
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [processDialogOpen, setProcessDialogOpen] = useState(false)
  const [processAction, setProcessAction] = useState<'RESOLVE' | 'REJECT'>('RESOLVE')
  const [adminNote, setAdminNote] = useState('')
  const [deleteReview, setDeleteReview] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)

  // 관리자 권한 체크는 백엔드에서 하므로 여기서는 로딩 상태만 관리
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [authLoading, user, router])

  useEffect(() => {
    loadData()
  }, [activeTab])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [statsResult, reportsResult] = await Promise.all([
        api.getAdminStats(),
        api.getReports(activeTab === 'ALL' ? undefined : activeTab),
      ])

      if (statsResult.success) {
        setStats(statsResult.data)
      }
      if (reportsResult.success) {
        setReports(reportsResult.data.content)
      }
    } catch (error) {
      console.error('Failed to load admin data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleProcess = async () => {
    if (!selectedReport) return

    setIsProcessing(true)
    try {
      const result = await api.processReport(selectedReport.id, {
        action: processAction,
        adminNote: adminNote || undefined,
        deleteReview: processAction === 'RESOLVE' && deleteReview,
      })

      if (result.success) {
        // 목록 업데이트
        setReports(prev =>
          prev.map(r => (r.id === selectedReport.id ? result.data : r))
        )
        // 통계 업데이트
        if (stats) {
          setStats({
            ...stats,
            pendingReportCount: stats.pendingReportCount - 1,
          })
        }
        setProcessDialogOpen(false)
        resetProcessForm()
      }
    } catch (error) {
      console.error('Failed to process report:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const resetProcessForm = () => {
    setSelectedReport(null)
    setAdminNote('')
    setDeleteReview(false)
  }

  const openProcessDialog = (report: Report, action: 'RESOLVE' | 'REJECT') => {
    setSelectedReport(report)
    setProcessAction(action)
    setProcessDialogOpen(true)
  }

  const openDetailDialog = (report: Report) => {
    setSelectedReport(report)
    setDetailDialogOpen(true)
  }

  const getStatusBadgeVariant = (status: ReportStatus) => {
    switch (status) {
      case 'PENDING':
        return 'default'
      case 'RESOLVED':
        return 'secondary'
      case 'REJECTED':
        return 'outline'
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold">관리자 페이지</h1>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-3 gap-3 p-4">
          <Card className="p-4 text-center">
            <AlertTriangle className="h-6 w-6 mx-auto text-orange-500 mb-2" />
            <p className="text-2xl font-bold">{stats.pendingReportCount}</p>
            <p className="text-xs text-muted-foreground">대기중 신고</p>
          </Card>
          <Card className="p-4 text-center">
            <Users className="h-6 w-6 mx-auto text-blue-500 mb-2" />
            <p className="text-2xl font-bold">{stats.totalUserCount}</p>
            <p className="text-xs text-muted-foreground">총 회원수</p>
          </Card>
          <Card className="p-4 text-center">
            <FileText className="h-6 w-6 mx-auto text-green-500 mb-2" />
            <p className="text-2xl font-bold">{stats.totalReviewCount}</p>
            <p className="text-xs text-muted-foreground">총 리뷰수</p>
          </Card>
        </div>
      )}

      {/* Reports Tabs */}
      <div className="p-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ReportStatus | 'ALL')}>
          <TabsList className="w-full">
            <TabsTrigger value="PENDING" className="flex-1">대기중</TabsTrigger>
            <TabsTrigger value="RESOLVED" className="flex-1">처리완료</TabsTrigger>
            <TabsTrigger value="REJECTED" className="flex-1">반려</TabsTrigger>
            <TabsTrigger value="ALL" className="flex-1">전체</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4 space-y-3">
            {reports.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">
                신고 내역이 없습니다
              </Card>
            ) : (
              reports.map((report) => (
                <Card key={report.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={getStatusBadgeVariant(report.status)}>
                          {REPORT_STATUS_LABELS[report.status]}
                        </Badge>
                        <Badge variant="outline">{report.reasonDescription}</Badge>
                      </div>
                      <p className="text-sm line-clamp-2 mb-2">{report.reviewContent}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>리뷰 작성자: {report.reviewAuthorName}</span>
                        <span>·</span>
                        <span>신고자: {report.reporterName}</span>
                        <span>·</span>
                        <span>{formatRelativeTime(report.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDetailDialog(report)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {report.status === 'PENDING' && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-green-600 hover:text-green-700"
                            onClick={() => openProcessDialog(report, 'RESOLVE')}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => openProcessDialog(report, 'REJECT')}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>신고 상세</DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-1">상태</h4>
                <Badge variant={getStatusBadgeVariant(selectedReport.status)}>
                  {REPORT_STATUS_LABELS[selectedReport.status]}
                </Badge>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">신고 사유</h4>
                <p className="text-sm">{selectedReport.reasonDescription}</p>
              </div>
              {selectedReport.description && (
                <div>
                  <h4 className="text-sm font-medium mb-1">신고자 설명</h4>
                  <p className="text-sm text-muted-foreground">{selectedReport.description}</p>
                </div>
              )}
              <div>
                <h4 className="text-sm font-medium mb-1">신고된 리뷰</h4>
                <Card className="p-3">
                  <p className="text-sm mb-2">{selectedReport.reviewContent}</p>
                  <div className="text-xs text-muted-foreground">
                    <span>작성자: {selectedReport.reviewAuthorName}</span>
                    <span> · </span>
                    <span>식당: {selectedReport.restaurantName}</span>
                  </div>
                </Card>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium mb-1">신고자</h4>
                  <p className="text-muted-foreground">{selectedReport.reporterName}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">신고일시</h4>
                  <p className="text-muted-foreground">{formatRelativeTime(selectedReport.createdAt)}</p>
                </div>
              </div>
              {selectedReport.adminNote && (
                <div>
                  <h4 className="text-sm font-medium mb-1">관리자 메모</h4>
                  <p className="text-sm text-muted-foreground">{selectedReport.adminNote}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              닫기
            </Button>
            {selectedReport?.status === 'PENDING' && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setDetailDialogOpen(false)
                    openProcessDialog(selectedReport, 'REJECT')
                  }}
                >
                  반려
                </Button>
                <Button
                  onClick={() => {
                    setDetailDialogOpen(false)
                    openProcessDialog(selectedReport, 'RESOLVE')
                  }}
                >
                  처리
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Process Dialog */}
      <Dialog open={processDialogOpen} onOpenChange={setProcessDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {processAction === 'RESOLVE' ? '신고 처리' : '신고 반려'}
            </DialogTitle>
            <DialogDescription>
              {processAction === 'RESOLVE'
                ? '신고를 처리하고 필요시 리뷰를 삭제합니다.'
                : '신고를 반려합니다. 리뷰는 유지됩니다.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">관리자 메모 (선택)</label>
              <Textarea
                placeholder="처리 내용을 기록해주세요"
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows={3}
              />
            </div>

            {processAction === 'RESOLVE' && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="deleteReview"
                  checked={deleteReview}
                  onCheckedChange={(checked) => setDeleteReview(checked === true)}
                />
                <label htmlFor="deleteReview" className="text-sm flex items-center gap-1 cursor-pointer">
                  <Trash2 className="h-4 w-4 text-destructive" />
                  리뷰 삭제
                </label>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setProcessDialogOpen(false)
                resetProcessForm()
              }}
              disabled={isProcessing}
            >
              취소
            </Button>
            <Button
              onClick={handleProcess}
              disabled={isProcessing}
              variant={processAction === 'REJECT' ? 'destructive' : 'default'}
            >
              {isProcessing ? '처리 중...' : processAction === 'RESOLVE' ? '처리 완료' : '반려'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
