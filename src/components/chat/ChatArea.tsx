'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { useChatStore } from '@/store/chat';
import { useWebSocket } from '@/hooks/useWebSocket';
import { chatAPI } from '@/lib/api';
import type { ApiResponse, SendMessageResponse, Message } from '@/types';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { Bot, Loader2 } from 'lucide-react';

interface ChatAreaProps {
  onConversationsChange: () => void;
}

export function ChatArea({ onConversationsChange }: ChatAreaProps) {
  const { token } = useAuthStore();
  const {
    currentConversation,
    setCurrentConversation,
    addMessage,
    isStreaming,
    streamingContent,
    setIsStreaming,
    setStreamingContent,
    addConversation,
  } = useChatStore();
  
  const { isConnected, isAuthenticatedWS, error: wsError, sendChatMessage } = useWebSocket();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentConversation?.messages, streamingContent]);

  // When streaming completes, add the message to the conversation
  useEffect(() => {
    if (!isStreaming && streamingContent && currentConversation) {
      const assistantMessage: Message = {
        role: 'assistant',
        content: streamingContent,
        timestamp: new Date().toISOString(),
      };
      addMessage(currentConversation._id, assistantMessage);
      setStreamingContent('');
      onConversationsChange();
    }
  }, [isStreaming, streamingContent, currentConversation, addMessage, setStreamingContent, onConversationsChange]);

  const handleSendMessage = async (content: string) => {
    if (!token || !content.trim()) return;

    setError(null);

    // Add user message to UI immediately
    const userMessage: Message = {
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toISOString(),
    };

    // If using WebSocket and connected
    if (isConnected && isAuthenticatedWS) {
      if (currentConversation) {
        addMessage(currentConversation._id, userMessage);
        sendChatMessage(content.trim(), currentConversation._id);
      } else {
        // Create new conversation first via REST API, then use WebSocket
        setLoading(true);
        try {
          const response = await chatAPI.sendMessage(
            token, 
            content.trim()
          ) as ApiResponse<SendMessageResponse>;
          
          if (response.success && response.data) {
            // Fetch the full conversation
            const convResponse = await chatAPI.getConversation(
              token, 
              response.data.conversationId
            ) as ApiResponse<{ conversation: typeof currentConversation }>;
            
            if (convResponse.success && convResponse.data) {
              setCurrentConversation(convResponse.data.conversation);
              addConversation(convResponse.data.conversation!);
              onConversationsChange();
            }
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to send message');
        } finally {
          setLoading(false);
        }
      }
    } else {
      // Fallback to REST API
      setLoading(true);
      setIsStreaming(true);
      
      try {
        if (currentConversation) {
          addMessage(currentConversation._id, userMessage);
        }

        const response = await chatAPI.sendMessage(
          token,
          content.trim(),
          currentConversation?._id
        ) as ApiResponse<SendMessageResponse>;

        if (response.success && response.data) {
          // Fetch the full conversation to get updated messages
          const convResponse = await chatAPI.getConversation(
            token, 
            response.data.conversationId
          ) as ApiResponse<{ conversation: typeof currentConversation }>;
          
          if (convResponse.success && convResponse.data) {
            if (!currentConversation) {
              addConversation(convResponse.data.conversation!);
            }
            setCurrentConversation(convResponse.data.conversation);
            onConversationsChange();
          }
        } else {
          setError(response.error || 'Failed to send message');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send message');
      } finally {
        setLoading(false);
        setIsStreaming(false);
      }
    }
  };

  const messages = currentConversation?.messages || [];
  const displayError = error || wsError;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3">
        <h2 className="font-semibold text-gray-900 dark:text-white truncate">
          {currentConversation?.title || 'New Chat'}
        </h2>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span
            className={`w-2 h-2 rounded-full ${
              isConnected && isAuthenticatedWS ? 'bg-green-500' : 'bg-yellow-500'
            }`}
          />
          {isConnected && isAuthenticatedWS ? 'Real-time connected' : 'Using REST API'}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-800">
        {messages.length === 0 && !streamingContent ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Bot className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                How can I help you today?
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                Start a conversation by typing a message below. I&apos;m here to assist you with any questions.
              </p>
            </div>
          </div>
        ) : (
          <MessageList
            messages={messages}
            streamingContent={streamingContent}
            isStreaming={isStreaming}
          />
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error display */}
      {displayError && (
        <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">{displayError}</p>
        </div>
      )}

      {/* Input area */}
      <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
        <ChatInput
          onSend={handleSendMessage}
          disabled={loading || isStreaming}
          placeholder={loading || isStreaming ? 'Generating response...' : 'Type your message...'}
        />
        {(loading || isStreaming) && (
          <div className="flex items-center justify-center mt-2 text-sm text-gray-500">
            <Loader2 className="animate-spin mr-2" size={14} />
            Generating response...
          </div>
        )}
      </div>
    </div>
  );
}
