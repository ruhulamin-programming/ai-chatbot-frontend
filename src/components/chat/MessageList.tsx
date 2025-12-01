"use client";

import type { Message } from "@/types";
import { User, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageListProps {
  messages: Message[];
  streamingContent: string;
  isStreaming: boolean;
}

export function MessageList({
  messages,
  streamingContent,
  isStreaming,
}: MessageListProps) {
  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-700">
      {messages.map((message, index) => (
        <MessageItem
          key={index}
          message={message}
          isStreaming={
            isStreaming &&
            index === messages.length - 1 &&
            message.role === "assistant"
          }
        />
      ))}

      {streamingContent && isStreaming && (
        <MessageItem
          message={{
            role: "assistant",
            content: streamingContent,
            timestamp: new Date().toISOString(),
          }}
          isStreaming
        />
      )}
    </div>
  );
}

interface MessageItemProps {
  message: Message;
  isStreaming?: boolean;
}

function MessageItem({ message, isStreaming }: MessageItemProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "px-4 py-6",
        isUser ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-900"
      )}
    >
      <div className="max-w-3xl mx-auto flex gap-4">
        <div
          className={cn(
            "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
            isUser ? "bg-blue-600 text-white" : "bg-green-600 text-white"
          )}
        >
          {isUser ? <User size={18} /> : <Bot size={18} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-gray-900 dark:text-white mb-1">
            {isUser ? "You" : "AI Assistant"}
          </div>
          <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
            {message.content}
            {isStreaming && (
              <span className="inline-block w-2 h-4 ml-1 bg-gray-400 animate-pulse" />
            )}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {new Date(message.timestamp).toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
}
