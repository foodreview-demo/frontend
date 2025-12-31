"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import { Client, IMessage } from "@stomp/stompjs"
import SockJS from "sockjs-client"
import { ChatMessage } from "./api"

const WS_URL = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "/ws") || "http://localhost:8080/ws"

export interface NewMessageNotification {
  roomUuid: string
  message: ChatMessage
}

interface UseNotificationSocketOptions {
  userId: number
  onNotification: (notification: NewMessageNotification) => void
  enabled?: boolean
}

export function useNotificationSocket({ userId, onNotification, enabled = true }: UseNotificationSocketOptions) {
  const clientRef = useRef<Client | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  const connect = useCallback(() => {
    if (!enabled || !userId) return

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      connectHeaders: {
        userId: String(userId),
      },
      debug: () => {},
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        setIsConnected(true)

        // 사용자별 알림 구독
        client.subscribe(`/topic/user/${userId}/notification`, (message: IMessage) => {
          try {
            const notification = JSON.parse(message.body) as NewMessageNotification
            onNotification(notification)
          } catch (e) {
            // parse error
          }
        })
      },
      onDisconnect: () => {
        setIsConnected(false)
      },
      onStompError: () => {
        setIsConnected(false)
      },
      onWebSocketError: () => {
        setIsConnected(false)
      },
    })

    client.activate()
    clientRef.current = client
  }, [enabled, userId, onNotification])

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.deactivate()
      clientRef.current = null
      setIsConnected(false)
    }
  }, [])

  useEffect(() => {
    connect()
    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  return {
    isConnected,
    disconnect,
    reconnect: connect,
  }
}
