"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Plus,
  Loader2,
  Lock,
  Globe,
  MoreVertical,
  Pencil,
  Trash2,
  ListMusic,
  ChevronRight,
} from "lucide-react"
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
import { MobileLayout } from "@/components/mobile-layout"
import { api, Playlist } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"

export default function PlaylistsPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null)
  const [formName, setFormName] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formPublic, setFormPublic] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
      return
    }
    if (user) {
      fetchPlaylists()
    }
  }, [user, authLoading])

  const fetchPlaylists = async () => {
    setIsLoading(true)
    try {
      const result = await api.getMyPlaylists()
      if (result.success) {
        setPlaylists(result.data.content)
      }
    } catch (error) {
      console.error("Failed to fetch playlists:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!formName.trim()) return

    setIsSubmitting(true)
    try {
      const result = await api.createPlaylist({
        name: formName.trim(),
        description: formDescription.trim() || undefined,
        isPublic: formPublic,
      })

      if (result.success) {
        setPlaylists((prev) => [result.data, ...prev])
        resetForm()
        setShowCreateDialog(false)
      }
    } catch (error) {
      console.error("Failed to create playlist:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = async () => {
    if (!editingPlaylist || !formName.trim()) return

    setIsSubmitting(true)
    try {
      const result = await api.updatePlaylist(editingPlaylist.id, {
        name: formName.trim(),
        description: formDescription.trim() || undefined,
        isPublic: formPublic,
      })

      if (result.success) {
        setPlaylists((prev) =>
          prev.map((p) => (p.id === editingPlaylist.id ? result.data : p))
        )
        resetForm()
        setShowEditDialog(false)
        setEditingPlaylist(null)
      }
    } catch (error) {
      console.error("Failed to update playlist:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (playlistId: number) => {
    if (!confirm("정말 이 리스트를 삭제하시겠습니까?")) return

    try {
      await api.deletePlaylist(playlistId)
      setPlaylists((prev) => prev.filter((p) => p.id !== playlistId))
    } catch (error) {
      console.error("Failed to delete playlist:", error)
    }
  }

  const openEditDialog = (playlist: Playlist) => {
    setEditingPlaylist(playlist)
    setFormName(playlist.name)
    setFormDescription(playlist.description || "")
    setFormPublic(playlist.isPublic)
    setShowEditDialog(true)
  }

  const resetForm = () => {
    setFormName("")
    setFormDescription("")
    setFormPublic(false)
  }

  if (authLoading || isLoading) {
    return (
      <MobileLayout>
        <div className="flex justify-center items-center flex-1 min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MobileLayout>
    )
  }

  return (
    <MobileLayout>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">내 리스트</h1>
          <Button
            size="sm"
            onClick={() => {
              resetForm()
              setShowCreateDialog(true)
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            새 리스트
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1">
        {playlists.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <ListMusic className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-center mb-4">
              아직 리스트가 없습니다
              <br />
              마음에 드는 음식점을 모아보세요
            </p>
            <Button
              onClick={() => {
                resetForm()
                setShowCreateDialog(true)
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              첫 리스트 만들기
            </Button>
          </div>
        ) : (
          <div className="divide-y">
            {playlists.map((playlist) => (
              <div
                key={playlist.id}
                className="flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors"
              >
                <Link
                  href={`/playlist?id=${playlist.id}`}
                  className="flex items-center gap-3 flex-1 min-w-0"
                >
                  <div className="w-14 h-14 rounded-lg bg-secondary overflow-hidden shrink-0">
                    {playlist.thumbnail ? (
                      <img
                        src={playlist.thumbnail}
                        alt={playlist.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ListMusic className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold truncate">
                        {playlist.name}
                      </span>
                      {playlist.isPublic ? (
                        <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      ) : (
                        <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {playlist.itemCount}개의 음식점
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="shrink-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEditDialog(playlist)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      수정
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleDelete(playlist.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      삭제
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>새 리스트 만들기</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="name">이름</Label>
              <Input
                id="name"
                placeholder="리스트 이름"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">설명 (선택)</Label>
              <Input
                id="description"
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
                <Label htmlFor="public">{formPublic ? "공개" : "비공개"}</Label>
              </div>
              <Switch
                id="public"
                checked={formPublic}
                onCheckedChange={setFormPublic}
              />
            </div>
            <Button
              className="w-full"
              onClick={handleCreate}
              disabled={!formName.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "만들기"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
    </MobileLayout>
  )
}
