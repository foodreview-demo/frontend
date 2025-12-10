"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import { Client, IMessage } from "@stomp/stompjs"
import SockJS from "sockjs-client"
import { ChatMessage } from "./api"

const WS_URL = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "/ws") || "http://localhost:8080/ws"

export interface ReadNotification {
  roomUuid: string
  readByUserId: number
}

interface UseChatSocketOptions {
  roomUuid: string
  userId: number
  onMessage: (message: ChatMessage) => void
  onReadNotification?: (notification: ReadNotification) => void
  enabled?: boolean
}

export function useChatSocket({ roomUuid, userId, onMessage, onReadNotification, enabled = true }: UseChatSocketOptions) {
  const clientRef = useRef<Client | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const connect = useCallback(() => {
    if (!enabled || !roomUuid || roomUuid === "placeholder") return

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      connectHeaders: {
        userId: String(userId),
      },
      debug: (str) => {
        console.log("[STOMP]", str)
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        console.log("[STOMP] Connected")
        setIsConnected(true)
        setError(null)

        // 채팅방 구독
        client.subscribe(`/topic/chat/${roomUuid}`, (message: IMessage) => {
          try {
            const chatMessage = JSON.parse(message.body) as ChatMessage
            console.log("[STOMP] Message received:", chatMessage)
            onMessage(chatMessage)
          } catch (e) {
            console.error("[STOMP] Failed to parse message:", e)
          }
        })

        // 읽음 알림 구독
        client.subscribe(`/topic/chat/${roomUuid}/read`, (message: IMessage) => {
          try {
            const notification = JSON.parse(message.body) as ReadNotification
            console.log("[STOMP] Read notification received:", notification)
            onReadNotification?.(notification)
          } catch (e) {
            console.error("[STOMP] Failed to parse read notification:", e)
          }
        })
      },
      onDisconnect: () => {
        console.log("[STOMP] Disconnected")
        setIsConnected(false)
      },
      onStompError: (frame) => {
        console.error("[STOMP] Error:", frame.headers["message"])
        setError(frame.headers["message"] || "WebSocket 연결 오류")
        setIsConnected(false)
      },
      onWebSocketError: (event) => {
        console.error("[STOMP] WebSocket Error:", event)
        setError("WebSocket 연결 실패")
        setIsConnected(false)
      },
    })

    client.activate()
    clientRef.current = client
  }, [enabled, roomUuid, userId, onMessage])

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.deactivate()
      clientRef.current = null
      setIsConnected(false)
    }
  }, [])

  const sendMessage = useCallback((content: string) => {
    if (!clientRef.current || !clientRef.current.connected) {
      console.error("[STOMP] Not connected")
      return false
    }

    try {
      clientRef.current.publish({
        destination: `/app/chat/${roomUuid}`,
        headers: {
          userId: String(userId),
        },
        body: JSON.stringify({ content }),
      })
      return true
    } catch (e) {
      console.error("[STOMP] Failed to send message:", e)
      return false
    }
  }, [roomUuid, userId])

  // 읽음 알림 전송
  const sendReadNotification = useCallback(() => {
    if (!clientRef.current || !clientRef.current.connected) {
      console.error("[STOMP] Not connected")
      return false
    }

    try {
      clientRef.current.publish({
        destination: `/app/chat/${roomUuid}/read`,
        headers: {
          userId: String(userId),
        },
        body: "",
      })
      return true
    } catch (e) {
      console.error("[STOMP] Failed to send read notification:", e)
      return false
    }
  }, [roomUuid, userId])

  useEffect(() => {
    connect()
    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  return {
    isConnected,
    error,
    sendMessage,
    sendReadNotification,
    disconnect,
    reconnect: connect,
  }
}
