"use client";

import { useEffect, useRef, useCallback } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from "@capacitor/push-notifications";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export function usePushNotifications() {
  const { user } = useAuth();
  const tokenRef = useRef<string | null>(null);
  const isRegisteredRef = useRef(false);

  // 푸시 알림 초기화 및 권한 요청
  const initializePush = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) {
      console.log("Push notifications only available on native platform");
      return;
    }

    try {
      // 권한 확인
      let permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive === "prompt") {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== "granted") {
        console.log("Push notification permission denied");
        return;
      }

      // 푸시 등록
      await PushNotifications.register();
    } catch (error) {
      console.error("Push initialization error:", error);
    }
  }, []);

  // FCM 토큰을 서버에 등록
  const registerTokenWithServer = useCallback(async (token: string) => {
    if (!user) {
      console.log("User not logged in, skipping FCM token registration");
      return;
    }

    try {
      const deviceType = Capacitor.getPlatform().toUpperCase(); // "ANDROID" or "IOS"
      const deviceId = localStorage.getItem("deviceId") || undefined;

      const result = await api.registerFcmToken(token, deviceType, deviceId);
      if (result.success) {
        console.log("FCM token registered successfully");
        isRegisteredRef.current = true;
      } else {
        console.error("FCM token registration failed:", result.message);
      }
    } catch (error) {
      console.error("FCM token registration error:", error);
    }
  }, [user]);

  // FCM 토큰 해제
  const unregisterToken = useCallback(async () => {
    if (!tokenRef.current) return;

    try {
      await api.unregisterFcmToken(tokenRef.current);
      console.log("FCM token unregistered");
      isRegisteredRef.current = false;
    } catch (error) {
      console.error("FCM token unregistration error:", error);
    }
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    // 토큰 등록 이벤트
    const tokenListener = PushNotifications.addListener("registration", (token: Token) => {
      console.log("Push registration success, token:", token.value.substring(0, 20) + "...");
      tokenRef.current = token.value;

      if (user) {
        registerTokenWithServer(token.value);
      }
    });

    // 토큰 등록 실패 이벤트
    const errorListener = PushNotifications.addListener("registrationError", (error) => {
      console.error("Push registration error:", error.error);
    });

    // 푸시 알림 수신 (앱이 포그라운드일 때)
    const notificationListener = PushNotifications.addListener(
      "pushNotificationReceived",
      (notification: PushNotificationSchema) => {
        console.log("Push notification received:", notification);
        // 포그라운드에서 알림을 받았을 때 처리
        // 필요하다면 로컬 알림이나 토스트 표시
      }
    );

    // 푸시 알림 클릭/탭 이벤트
    const actionListener = PushNotifications.addListener(
      "pushNotificationActionPerformed",
      (action: ActionPerformed) => {
        console.log("Push notification action:", action);
        const clickAction = action.notification.data?.click_action;
        if (clickAction && typeof window !== "undefined") {
          // 해당 페이지로 이동
          window.location.href = clickAction;
        }
      }
    );

    // 사용자가 로그인되어 있으면 푸시 초기화
    if (user) {
      initializePush();
    }

    return () => {
      tokenListener.then((l) => l.remove());
      errorListener.then((l) => l.remove());
      notificationListener.then((l) => l.remove());
      actionListener.then((l) => l.remove());
    };
  }, [user, initializePush, registerTokenWithServer]);

  // 사용자 변경 시 토큰 재등록
  useEffect(() => {
    if (user && tokenRef.current && !isRegisteredRef.current) {
      registerTokenWithServer(tokenRef.current);
    }
  }, [user, registerTokenWithServer]);

  return {
    initializePush,
    unregisterToken,
  };
}
