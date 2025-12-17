"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Loader2,
  Lock,
  Globe,
  MoreVertical,
  Pencil,
  Trash2,
  Star,
  MapPin,
  ListMusic,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { api, PlaylistDetail } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { RequireAuth } from "@/components/require-auth"

function PlaylistDetailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuth()
  const playlistId = searchParams.get("id")

  const [playlist, setPlaylist] = useState<PlaylistDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [formName, setFormName] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formPublic, setFormPublic] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isOwner = playlist?.user?.id === user?.id

  useEffect(() => {
    if (playlistId) {
      fetchPlaylist()
    }
  }, [playlistId])

  const fetchPlaylist = async () => {
    if (!playlistId) return

    setIsLoading(true)
    try {
      const result = await api.getPlaylistDetail(Number(playlistId))
      if (result.success) {
        setPlaylist(result.data)
      }
    } catch (error) {
      console.error("Failed to fetch playlist:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = async () => {
    if (!formName.trim() || !playlistId) return

    setIsSubmitting(true)
    try {
      const result = await api.updatePlaylist(Number(playlistId), {
        name: formName.trim(),
        description: formDescription.trim() || undefined,
        isPublic: formPublic,
      })

      if (result.success) {
        setPlaylist((prev) =>
          prev
            ? {
                ...prev,
                name: result.data.name,
                description: result.data.description,
                isPublic: result.data.isPublic,
              }
            : null
        )
        setShowEditDialog(false)
      }
    } catch (error) {
      console.error("Failed to update playlist:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!playlistId || !confirm("정말 이 리스트를 삭제하시겠습니까?")) return

    try {
      await api.deletePlaylist(Number(playlistId))
      router.push("/playlists")
    } catch (error) {
      console.error("Failed to delete playlist:", error)
    }
  }

  const handleRemoveItem = async (restaurantId: number) => {
    if (!playlistId || !confirm("이 음식점을 리스트에서 제거하시겠습니까?")) return

    try {
      await api.removeFromPlaylist(Number(playlistId), restaurantId)
      setPlaylist((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.filter((item) => item.restaurant.id !== restaurantId),
              itemCount: prev.itemCount - 1,
            }
          : null
      )
    } catch (error) {
      console.error("Failed to remove item:", error)
    }
  }

  const openEditDialog = () => {
    if (!playlist) return
    setFormName(playlist.name)
    setFormDescription(playlist.description || "")
    setFormPublic(playlist.isPublic)
    setShowEditDialog(true)
  }

  if (!playlistId) {
    return (
      <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto">
        <div className="flex flex-col items-center justify-center flex-1 p-4">
          <p className="text-muted-foreground">잘못된 접근입니다</p>
          <Link href="/playlists">
            <Button className="mt-4">리스트로 돌아가기</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto">
        <div className="flex justify-center items-center flex-1">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (!playlist) {
    return (
      <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto">
        <div className="flex flex-col items-center justify-center flex-1 p-4">
          <p className="text-muted-foreground">리스트를 찾을 수 없습니다</p>
          <Button className="mt-4" onClick={() => router.back()}>
            돌아가기
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b px-2 py-2">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="font-semibold truncate">{playlist.name}</h1>
              {playlist.isPublic ? (
                <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
              ) : (
                <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {playlist.itemCount}개의 음식점
            </p>
          </div>
          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={openEditDialog}>
                  <Pencil className="h-4 w-4 mr-2" />
                  수정
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  삭제
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      {/* Description */}
      {playlist.description && (
        <div className="px-4 py-3 bg-secondary/30 border-b">
          <p className="text-sm text-muted-foreground">{playlist.description}</p>
        </div>
      )}

      {/* Owner info (for public playlists viewed by others) */}
      {!isOwner && playlist.user && (
        <Link
          href={`/profile/${playlist.user.id}`}
          className="flex items-center gap-3 px-4 py-3 border-b hover:bg-secondary/50 transition-colors"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={playlist.user.avatar || "/placeholder.svg"} />
            <AvatarFallback>{playlist.user.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium">{playlist.user.name}</span>
            <span className="text-xs text-muted-foreground ml-1">님의 리스트</span>
          </div>
        </Link>
      )}

      {/* Items */}
      <div className="flex-1">
        {playlist.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <ListMusic className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-center">
              아직 저장된 음식점이 없습니다
            </p>
            {isOwner && (
              <Link href="/">
                <Button className="mt-4">음식점 둘러보기</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y">
            {playlist.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors"
              >
                <Link
                  href={`/restaurant/${item.restaurant.id}`}
                  className="flex items-center gap-3 flex-1 min-w-0"
                >
                  <div className="w-16 h-16 rounded-lg bg-secondary overflow-hidden shrink-0">
                    {item.restaurant.thumbnail ? (
                      <img
                        src={item.restaurant.thumbnail}
                        alt={item.restaurant.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                        No Image
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">
                      {item.restaurant.name}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{item.restaurant.categoryDisplay}</span>
                      <span>|</span>
                      <div className="flex items-center gap-0.5">
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        <span>{item.restaurant.averageRating?.toFixed(1) || "-"}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{item.restaurant.region}</span>
                    </div>
                    {item.memo && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {item.memo}
                      </p>
                    )}
                  </div>
                </Link>
                {isOwner && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={() => handleRemoveItem(item.restaurant.id)}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>리스트 수정</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="edit-name">이름</Label>
              <Input
                id="edit-name"
                placeholder="리스트 이름"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">설명 (선택)</Label>
              <Input
                id="edit-description"
                placeholder="리스트 설명"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {formPublic ? (
                  <Globe className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Lock className="h-4 w-4 text-muted-foreground" />
                )}
                <Label htmlFor="edit-public">
                  {formPublic ? "공개" : "비공개"}
                </Label>
              </div>
              <Switch
                id="edit-public"
                checked={formPublic}
                onCheckedChange={setFormPublic}
              />
            </div>
            <Button
              className="w-full"
              onClick={handleEdit}
              disabled={!formName.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "저장"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function PlaylistDetailPage() {
  return (
    <RequireAuth>
      <Suspense
        fallback={
          <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto">
            <div className="flex justify-center items-center flex-1">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          </div>
        }
      >
        <PlaylistDetailContent />
      </Suspense>
    </RequireAuth>
  )
}
