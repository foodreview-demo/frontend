import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { AuthProvider } from "@/lib/auth-context"
import { I18nProvider } from "@/lib/i18n-context"
import { FeedSettingsProvider } from "@/lib/feed-settings-context"
import { PushNotificationProvider } from "@/lib/push-notification-provider"
import { PWARegister } from "@/components/pwa-register"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "맛잘알 - 진짜 리뷰만",
  description: "광고 없는 순수 맛집 리뷰 플랫폼. 맛잘알들의 신뢰할 수 있는 리뷰를 만나보세요.",
  generator: "v0.app",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "맛잘알",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
}

export const viewport: Viewport = {
  themeColor: "#f97316",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <body className={`font-sans antialiased`}>
        <PWARegister />
        <I18nProvider>
          <FeedSettingsProvider>
            <AuthProvider>
              <PushNotificationProvider>
                {children}
              </PushNotificationProvider>
            </AuthProvider>
          </FeedSettingsProvider>
        </I18nProvider>
      </body>
    </html>
  )
}
