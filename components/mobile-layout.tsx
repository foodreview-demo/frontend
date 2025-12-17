"use client"

import type React from "react"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Home, Search, PenSquare, ListMusic, User, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { RequireAuth } from "./require-auth"
import { ChatButton } from "./chat-sidebar"

interface MobileLayoutProps {
  children: React.ReactNode
  hideNavigation?: boolean
  requireAuth?: boolean
  showChatButton?: boolean
}

export function MobileLayout({ children, hideNavigation, requireAuth = true, showChatButton = true }: MobileLayoutProps) {
  const pathname = usePathname()

  const navItems = [
    { href: "/", icon: Home, label: "홈" },
    { href: "/search", icon: Search, label: "검색" },
    { href: "/write", icon: PenSquare, label: "리뷰" },
    { href: "/follows", icon: Users, label: "친구" },
    { href: "/profile", icon: User, label: "내정보" },
  ]

  const content = (
    <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto relative">
      <main className={cn("flex-1 overflow-y-auto", !hideNavigation && "pb-[72px]")}>{children}</main>

      {/* Bottom Navigation */}
      {!hideNavigation && (
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-card border-t border-border h-[72px]">
          <div className="flex items-center justify-around h-full">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </nav>
      )}

      {/* 플로팅 채팅 버튼 */}
      {showChatButton && !hideNavigation && (
        <div className="fixed bottom-[88px] right-4 z-40">
          <ChatButton />
        </div>
      )}
    </div>
  )

  if (requireAuth) {
    return <RequireAuth>{content}</RequireAuth>
  }

  return content
}
