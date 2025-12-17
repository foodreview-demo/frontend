"use client"

// 브라우저 알림 권한 요청
export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) {
    console.log("This browser does not support notifications")
    return false
  }

  if (Notification.permission === "granted") {
    return true
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission()
    return permission === "granted"
  }

  return false
}

// 브라우저 알림 표시
export function showBrowserNotification(
  title: string,
  options?: {
    body?: string
    icon?: string
    tag?: string
    onClick?: () => void
  }
) {
  if (!("Notification" in window)) return

  if (Notification.permission === "granted") {
    const notification = new Notification(title, {
      body: options?.body,
      icon: options?.icon || "/apple-icon.png",
      tag: options?.tag,
      badge: "/apple-icon.png",
    })

    if (options?.onClick) {
      notification.onclick = () => {
        window.focus()
        options.onClick?.()
        notification.close()
      }
    }

    // 5초 후 자동으로 닫기
    setTimeout(() => notification.close(), 5000)
  }
}

// 알림 권한 상태 확인
export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (!("Notification" in window)) {
    return "unsupported"
  }
  return Notification.permission
}
