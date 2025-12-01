"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/auth";
import { useChatStore } from "@/store/chat";
import { useWebSocket } from "@/hooks/useWebSocket";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { Bot, Loader2 } from "lucide-react";

interface ChatAreaProps {
  onConversationsChange: () => void;
}

export function ChatArea({ onConversationsChange }: ChatAreaProps) {
  const { token } = useAuthStore();
  const {
    currentConversation,
    addMessage,
    isStreaming,
    streamingContent,
    setStreamingContent,
  } = useChatStore();

  const {
    isConnected,
    isAuthenticatedWS,
    sendChatMessage,
    error: wsError,
  } = useWebSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentConversation?.messages, streamingContent]);

  // Commit assistant message after streaming
  useEffect(() => {
    if (!isStreaming && streamingContent.length > 0 && currentConversation) {
      addMessage(currentConversation._id, {
        role: "assistant",
        content: streamingContent,
        timestamp: new Date().toISOString(),
      });
      setStreamingContent(""); // clear buffer
      onConversationsChange();
    }
  }, [
    isStreaming,
    streamingContent,
    currentConversation,
    addMessage,
    setStreamingContent,
    onConversationsChange,
  ]);

  const handleSendMessage = (content: string) => {
    if (!token || !content.trim() || !currentConversation) return;

    // Add user message
    addMessage(currentConversation._id, {
      role: "user",
      content: content.trim(),
      timestamp: new Date().toISOString(),
    });

    if (isConnected && isAuthenticatedWS) {
      sendChatMessage(content.trim(), currentConversation._id, "gpt-3.5-turbo");
    }
  };

  const messages = currentConversation?.messages || [];
  const displayError = wsError;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3">
        <h2 className="font-semibold text-gray-900 dark:text-white truncate">
          {currentConversation?.title || "New Chat"}
        </h2>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span
            className={`w-2 h-2 rounded-full ${
              isConnected && isAuthenticatedWS
                ? "bg-green-500"
                : "bg-yellow-500"
            }`}
          />
          {isConnected && isAuthenticatedWS
            ? "Real-time connected"
            : "Using REST API"}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-800">
        {messages.length === 0 && !streamingContent ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Bot className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                How can I help you today?
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                Start a conversation by typing a message below.
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

      {/* Input */}
      <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
        <ChatInput
          onSend={handleSendMessage}
          placeholder={
            isStreaming ? "Generating response..." : "Type your message..."
          }
        />
        {/* {isStreaming && (
          <div className="flex items-center justify-center mt-2 text-sm text-gray-500">
            <Loader2 className="animate-spin mr-2" size={14} />
            Generating response...
          </div>
        )} */}
        {displayError && (
          <div className="text-red-500 mt-2 text-sm">{displayError}</div>
        )}
      </div>
    </div>
  );
}
