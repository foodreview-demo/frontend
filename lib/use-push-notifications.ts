"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

// 동적으로 로드되는 PushNotifications 타입
type PushNotificationsPlugin = typeof import("@capacitor/push-notifications").PushNotifications;

// 전역 변수로 pending navigation 저장
let pendingNavigation: string | null = null;

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
        console.log("[Push] PushNotifications plugin loaded");
      })
      .catch((err) => {
        console.warn("[Push] Failed to load PushNotifications plugin:", err);
      });
  }, []);

  // 푸시 알림 초기화 및 권한 요청
  const initializePush = useCallback(async () => {
    if (!pushPlugin) {
      console.log("[Push] PushNotifications plugin not loaded yet");
      return;
    }

    try {
      // 권한 확인
      let permStatus = await pushPlugin.checkPermissions();

      if (permStatus.receive === "prompt") {
        permStatus = await pushPlugin.requestPermissions();
      }

      if (permStatus.receive !== "granted") {
        console.log("[Push] Push notification permission denied");
        return;
      }

      // 푸시 등록
      await pushPlugin.register();
    } catch (error) {
      console.warn("[Push] Push initialization error (non-fatal):", error);
    }
  }, [pushPlugin]);

  // FCM 토큰을 서버에 등록
  const registerTokenWithServer = useCallback(async (token: string) => {
    if (!user) {
      console.log("[Push] User not logged in, skipping FCM token registration");
      return;
    }

    try {
      const deviceType = Capacitor.getPlatform().toUpperCase();
      const deviceId = localStorage.getItem("deviceId") || undefined;

      const result = await api.registerFcmToken(token, deviceType, deviceId);
      if (result.success) {
        console.log("[Push] FCM token registered successfully");
        isRegisteredRef.current = true;
      } else {
        console.error("[Push] FCM token registration failed:", result.message);
      }
    } catch (error) {
      console.error("[Push] FCM token registration error:", error);
    }
  }, [user]);

  // FCM 토큰 해제
  const unregisterToken = useCallback(async () => {
    if (!tokenRef.current) return;

    try {
      await api.unregisterFcmToken(tokenRef.current);
      console.log("[Push] FCM token unregistered");
      isRegisteredRef.current = false;
    } catch (error) {
      console.error("[Push] FCM token unregistration error:", error);
    }
  }, []);

  // 알림 클릭 시 페이지 이동 처리
  const handleNotificationAction = useCallback((clickAction: string | undefined) => {
    console.log("[Push] handleNotificationAction called with:", clickAction);
    
    if (!clickAction || typeof window === "undefined") {
      console.log("[Push] No clickAction or window undefined");
      return;
    }

    console.log("[Push] Navigating to:", clickAction);
    // 약간의 딜레이 후 이동 (앱 초기화 대기)
    setTimeout(() => {
      window.location.href = clickAction;
    }, 300);
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
        console.log("[Push] Setting up listeners...");

        tokenListener = await pushPlugin.addListener("registration", (token) => {
          console.log("[Push] Registration success, token:", token.value.substring(0, 20) + "...");
          tokenRef.current = token.value;

          if (user) {
            registerTokenWithServer(token.value);
          }
        });

        errorListener = await pushPlugin.addListener("registrationError", (error) => {
          console.error("[Push] Registration error:", error.error);
        });

        notificationListener = await pushPlugin.addListener(
          "pushNotificationReceived",
          (notification) => {
            console.log("[Push] Notification received:", JSON.stringify(notification));
          }
        );

        actionListener = await pushPlugin.addListener(
          "pushNotificationActionPerformed",
          (action) => {
            console.log("[Push] Action performed:", JSON.stringify(action));
            console.log("[Push] Notification data:", JSON.stringify(action.notification?.data));
            const clickAction = action.notification?.data?.click_action;
            handleNotificationAction(clickAction);
          }
        );

        console.log("[Push] All listeners set up");

        // 앱이 알림으로 열렸을 때 처리 (앱이 종료 상태였던 경우)
        const delivered = await pushPlugin.getDeliveredNotifications();
        console.log("[Push] Delivered notifications:", delivered.notifications.length);
        
        if (delivered.notifications.length > 0) {
          console.log("[Push] First delivered:", JSON.stringify(delivered.notifications[0]));
        }

        // pending navigation 확인
        if (pendingNavigation) {
          console.log("[Push] Found pending navigation:", pendingNavigation);
          handleNotificationAction(pendingNavigation);
          pendingNavigation = null;
        }

        // 사용자가 로그인되어 있으면 푸시 초기화
        if (user) {
          initializePush();
        }
      } catch (error) {
        console.warn("[Push] Setup error (non-fatal):", error);
      }
    };

    setupListeners();

    return () => {
      tokenListener?.remove();
      errorListener?.remove();
      notificationListener?.remove();
      actionListener?.remove();
    };
  }, [pushPlugin, user, initializePush, registerTokenWithServer, handleNotificationAction]);

  // 앱 상태 변화 감지 (백그라운드에서 포그라운드로)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const checkAppState = async () => {
      try {
        const state = await App.getState();
        console.log("[Push] App state:", state.isActive ? "active" : "background");
      } catch (e) {
        console.warn("[Push] Failed to get app state:", e);
      }
    };

    checkAppState();

    const stateListener = App.addListener("appStateChange", (state) => {
      console.log("[Push] App state changed:", state.isActive ? "active" : "background");
    });

    return () => {
      stateListener.then(l => l.remove());
    };
  }, []);

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

// 외부에서 pending navigation 설정 (MainActivity에서 호출 가능)
export function setPendingPushNavigation(path: string) {
  console.log("[Push] setPendingPushNavigation:", path);
  pendingNavigation = path;
}
