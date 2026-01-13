"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

// 동적으로 로드되는 PushNotifications 타입
type PushNotificationsPlugin = typeof import("@capacitor/push-notifications").PushNotifications;

export function usePushNotifications() {
  const { user } = useAuth();
  const tokenRef = useRef<string | null>(null);
  const isRegisteredRef = useRef(false);
  const [pushPlugin, setPushPlugin] = useState<PushNotificationsPlugin | null>(null);

  // 플러그인 동적 로드 (클라이언트에서만)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!Capacitor.isNativePlatform()) return;

    import("@capacitor/push-notifications")
      .then((module) => {
        setPushPlugin(module.PushNotifications);
        console.log("PushNotifications plugin loaded");
      })
      .catch((err) => {
        console.warn("Failed to load PushNotifications plugin:", err);
      });
  }, []);

  // 푸시 알림 초기화 및 권한 요청
  const initializePush = useCallback(async () => {
    if (!pushPlugin) {
      console.log("PushNotifications plugin not loaded yet");
      return;
    }

    try {
      // 권한 확인
      let permStatus = await pushPlugin.checkPermissions();

      if (permStatus.receive === "prompt") {
        permStatus = await pushPlugin.requestPermissions();
      }

      if (permStatus.receive !== "granted") {
        console.log("Push notification permission denied");
        return;
      }

      // 푸시 등록
      await pushPlugin.register();
    } catch (error) {
      console.warn("Push initialization error (non-fatal):", error);
    }
  }, [pushPlugin]);

  // FCM 토큰을 서버에 등록
  const registerTokenWithServer = useCallback(async (token: string) => {
    if (!user) {
      console.log("User not logged in, skipping FCM token registration");
      return;
    }

    try {
      const deviceType = Capacitor.getPlatform().toUpperCase();
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

  // 리스너 등록
  useEffect(() => {
    if (!pushPlugin) return;

    let tokenListener: { remove: () => void } | null = null;
    let errorListener: { remove: () => void } | null = null;
    let notificationListener: { remove: () => void } | null = null;
    let actionListener: { remove: () => void } | null = null;

    const setupListeners = async () => {
      try {
        tokenListener = await pushPlugin.addListener("registration", (token) => {
          console.log("Push registration success, token:", token.value.substring(0, 20) + "...");
          tokenRef.current = token.value;

          if (user) {
            registerTokenWithServer(token.value);
          }
        });

        errorListener = await pushPlugin.addListener("registrationError", (error) => {
          console.error("Push registration error:", error.error);
        });

        notificationListener = await pushPlugin.addListener(
          "pushNotificationReceived",
          (notification) => {
            console.log("Push notification received:", notification);
          }
        );

        actionListener = await pushPlugin.addListener(
          "pushNotificationActionPerformed",
          (action) => {
            console.log("Push notification action:", action);
            const clickAction = action.notification.data?.click_action;
            if (clickAction && typeof window !== "undefined") {
              window.location.href = clickAction;
            }
          }
        );

        // 사용자가 로그인되어 있으면 푸시 초기화
        if (user) {
          initializePush();
        }
      } catch (error) {
        console.warn("Push notifications setup error (non-fatal):", error);
      }
    };

    setupListeners();

    return () => {
      tokenListener?.remove();
      errorListener?.remove();
      notificationListener?.remove();
      actionListener?.remove();
    };
  }, [pushPlugin, user, initializePush, registerTokenWithServer]);

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
