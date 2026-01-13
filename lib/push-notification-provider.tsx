"use client";

import { ReactNode } from "react";
import { usePushNotifications } from "@/lib/use-push-notifications";

interface PushNotificationProviderProps {
  children: ReactNode;
}

// 푸시 알림 초기화 컴포넌트
// AuthProvider 내부에서 사용해야 user 정보에 접근 가능
function PushNotificationInitializer() {
  // 이 훅이 사용자 로그인 상태를 감지하고 자동으로 푸시 알림을 초기화함
  usePushNotifications();
  return null;
}

export function PushNotificationProvider({ children }: PushNotificationProviderProps) {
  return (
    <>
      <PushNotificationInitializer />
      {children}
    </>
  );
}
