"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/store/auth";
import { useChatStore } from "@/store/chat";
import type { WSMessage, WSChatChunk, WSChatDone } from "@/types";

export function useWebSocket() {
  const { token, isAuthenticated } = useAuthStore();
  const { setIsStreaming, appendStreamingContent, clearStreamingContent } =
    useChatStore();

  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticatedWS, setIsAuthenticatedWS] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (!isAuthenticated || !token) return;

    if (wsRef.current) wsRef.current.close();

    const ws = new WebSocket("ws://localhost:3000/ws");
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setError(null);

      ws.send(JSON.stringify({ type: "auth", token }));

      pingIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "ping" }));
        }
      }, 25000);
    };

    ws.onmessage = (event) => {
      const message: WSMessage = JSON.parse(event.data);

      if (message.type === "auth") {
        setIsAuthenticatedWS(true);
      }

      if (message.type === "chat") {
        const chatPayload = message.payload as WSChatChunk | WSChatDone;

        if (chatPayload.type === "chunk") {
          setIsStreaming(true);
          appendStreamingContent(chatPayload.content);
        } else if (chatPayload.type === "done") {
          setIsStreaming(false);
        }
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      setIsAuthenticatedWS(false);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);

      if (isAuthenticated) {
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      }
    };

    ws.onerror = () => setError("WebSocket connection error");
  }, [isAuthenticated, token, appendStreamingContent, setIsStreaming]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
    if (wsRef.current) wsRef.current.close();
    wsRef.current = null;
    setIsConnected(false);
    setIsAuthenticatedWS(false);
  }, []);

  const sendChatMessage = useCallback(
    (message: string, conversationId?: string, model?: string) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        setError("WebSocket not connected");
        return;
      }
      if (!isAuthenticatedWS) {
        setError("WebSocket not authenticated");
        return;
      }

      clearStreamingContent();
      setIsStreaming(true);
      setError(null);

      wsRef.current.send(
        JSON.stringify({
          type: "chat",
          payload: { message, conversationId, model },
        })
      );
    },
    [isAuthenticatedWS, clearStreamingContent, setIsStreaming]
  );

  useEffect(() => {
    if (isAuthenticated) connect();
    else disconnect();
    return () => disconnect();
  }, [isAuthenticated, connect, disconnect]);

  return {
    isConnected,
    isAuthenticatedWS,
    error,
    sendChatMessage,
    connect,
    disconnect,
  };
}
