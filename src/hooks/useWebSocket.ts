'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { useChatStore } from '@/store/chat';
import type { WSMessage, WSChatChunk, WSChatDone, WSErrorPayload } from '@/types';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';

export function useWebSocket() {
  const { token, isAuthenticated } = useAuthStore();
  const { 
    setIsStreaming, 
    appendStreamingContent, 
    clearStreamingContent,
    currentConversation,
    setCurrentConversation,
  } = useChatStore();
  
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticatedWS, setIsAuthenticatedWS] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (!isAuthenticated || !token) return;
    
    // Clean up existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }

    const ws = new WebSocket(`${WS_URL}/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setError(null);
      
      // Send auth message
      ws.send(JSON.stringify({ type: 'auth', token }));
      
      // Start ping interval
      pingIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 25000);
    };

    ws.onmessage = (event) => {
      try {
        const message: WSMessage = JSON.parse(event.data);
        
        switch (message.type) {
          case 'auth':
            const authPayload = message.payload as { success: boolean };
            setIsAuthenticatedWS(authPayload.success);
            break;
            
          case 'chat':
            const chatPayload = message.payload as WSChatChunk | WSChatDone;
            if (chatPayload.type === 'chunk') {
              appendStreamingContent(chatPayload.content);
            } else if (chatPayload.type === 'done') {
              setIsStreaming(false);
              // Update conversation ID if it was a new conversation
              if (message.conversationId && currentConversation) {
                setCurrentConversation({
                  ...currentConversation,
                  _id: message.conversationId,
                });
              }
            }
            break;
            
          case 'error':
            const errorPayload = message.payload as WSErrorPayload;
            setError(errorPayload.error);
            setIsStreaming(false);
            break;
            
          case 'pong':
            // Heartbeat response
            break;
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      setIsAuthenticatedWS(false);
      
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      
      // Attempt to reconnect after 3 seconds
      if (isAuthenticated) {
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      }
    };

    ws.onerror = () => {
      setError('WebSocket connection error');
    };
  }, [
    isAuthenticated, 
    token, 
    appendStreamingContent, 
    setIsStreaming, 
    currentConversation, 
    setCurrentConversation
  ]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setIsAuthenticatedWS(false);
  }, []);

  const sendChatMessage = useCallback((
    message: string, 
    conversationId?: string, 
    model?: string
  ) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setError('WebSocket not connected');
      return;
    }
    
    if (!isAuthenticatedWS) {
      setError('WebSocket not authenticated');
      return;
    }

    clearStreamingContent();
    setIsStreaming(true);
    setError(null);

    wsRef.current.send(JSON.stringify({
      type: 'chat',
      payload: { message, conversationId, model },
    }));
  }, [isAuthenticatedWS, clearStreamingContent, setIsStreaming]);

  useEffect(() => {
    if (isAuthenticated) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
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
