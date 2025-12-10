"use client"

import { useState, useEffect } from "react"
import { Plus, Check, FolderPlus, Loader2, Lock, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { api, Playlist } from "@/lib/api"

interface SaveToPlaylistDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  restaurantId: number
  restaurantName: string
  onSaved?: () => void
}

export function SaveToPlaylistDialog({
  open,
  onOpenChange,
  restaurantId,
  restaurantName,
  onSaved,
}: SaveToPlaylistDialogProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [savedPlaylistIds, setSavedPlaylistIds] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState<number | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [newPlaylistName, setNewPlaylistName] = useState("")
  const [newPlaylistPublic, setNewPlaylistPublic] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    if (open) {
      fetchData()
    }
  }, [open, restaurantId])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [playlistsResult, statusResult] = await Promise.all([
        api.getMyPlaylistsAll(),
        api.getRestaurantSaveStatus(restaurantId),
      ])

      if (playlistsResult.success) {
        setPlaylists(playlistsResult.data)
      }
      if (statusResult.success) {
        setSavedPlaylistIds(statusResult.data.savedPlaylistIds)
      }
    } catch (error) {
      console.error("Failed to fetch playlists:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTogglePlaylist = async (playlistId: number) => {
    const isSaved = savedPlaylistIds.includes(playlistId)
    setIsSaving(playlistId)

    try {
      if (isSaved) {
        await api.removeFromPlaylist(playlistId, restaurantId)
        setSavedPlaylistIds((prev) => prev.filter((id) => id !== playlistId))
        setPlaylists((prev) =>
          prev.map((p) =>
            p.id === playlistId ? { ...p, itemCount: p.itemCount - 1 } : p
          )
        )
      } else {
        await api.addToPlaylist(playlistId, restaurantId)
        setSavedPlaylistIds((prev) => [...prev, playlistId])
        setPlaylists((prev) =>
          prev.map((p) =>
            p.id === playlistId ? { ...p, itemCount: p.itemCount + 1 } : p
          )
        )
      }
      onSaved?.()
    } catch (error) {
      console.error("Failed to toggle playlist:", error)
    } finally {
      setIsSaving(null)
    }
  }

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return

    setIsCreating(true)
    try {
      const result = await api.createPlaylist({
        name: newPlaylistName.trim(),
        isPublic: newPlaylistPublic,
      })

      if (result.success) {
        // 새로 만든 플레이리스트에 음식점 추가
        await api.addToPlaylist(result.data.id, restaurantId)
        setPlaylists((prev) => [{ ...result.data, itemCount: 1 }, ...prev])
        setSavedPlaylistIds((prev) => [...prev, result.data.id])
        setNewPlaylistName("")
        setNewPlaylistPublic(false)
        setShowCreate(false)
        onSaved?.()
      }
    } catch (error) {
      console.error("Failed to create playlist:", error)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-lg">리스트에 저장</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1 truncate">
            {restaurantName}
          </p>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          {/* 새 플레이리스트 만들기 */}
          {showCreate ? (
            <div className="space-y-3 p-3 bg-secondary/50 rounded-lg">
              <Input
                placeholder="리스트 이름"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                    handleCreatePlaylist()
                  }
                }}
                autoFocus
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {newPlaylistPublic ? (
                    <Globe className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  )}
                  <Label htmlFor="public-switch" className="text-sm">
                    {newPlaylistPublic ? "공개" : "비공개"}
                  </Label>
                </div>
                <Switch
                  id="public-switch"
                  checked={newPlaylistPublic}
                  onCheckedChange={setNewPlaylistPublic}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setShowCreate(false)
                    setNewPlaylistName("")
                  }}
                >
                  취소
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={handleCreatePlaylist}
                  disabled={!newPlaylistName.trim() || isCreating}
                >
                  {isCreating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "만들기"
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => setShowCreate(true)}
            >
              <FolderPlus className="h-4 w-4" />
              새 리스트 만들기
            </Button>
          )}

          {/* 플레이리스트 목록 */}
          <div className="max-h-[300px] overflow-y-auto space-y-1">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : playlists.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                아직 리스트가 없습니다
              </div>
            ) : (
              playlists.map((playlist) => {
                const isSaved = savedPlaylistIds.includes(playlist.id)
                const isCurrentSaving = isSaving === playlist.id

                return (
                  <button
                    key={playlist.id}
                    onClick={() => handleTogglePlaylist(playlist.id)}
                    disabled={isCurrentSaving}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left",
                      isSaved
                        ? "bg-primary/10 hover:bg-primary/20"
                        : "hover:bg-secondary"
                    )}
                  >
                    <div
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                        isSaved
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary"
                      )}
                    >
                      {isCurrentSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isSaved ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium truncate">
                          {playlist.name}
                        </span>
                        {playlist.isPublic ? (
                          <Globe className="h-3 w-3 text-muted-foreground shrink-0" />
                        ) : (
                          <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {playlist.itemCount}개의 음식점
                      </span>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
