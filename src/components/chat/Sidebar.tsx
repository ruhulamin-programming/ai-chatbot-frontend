'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { useChatStore } from '@/store/chat';
import { chatAPI } from '@/lib/api';
import type { Conversation } from '@/types';
import { 
  MessageSquare, 
  Plus, 
  Trash2, 
  LogOut, 
  User,
  Loader2 
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface SidebarProps {
  loading: boolean;
  onSelectConversation: (conversation: Conversation) => void;
  onNewConversation: () => void;
  onConversationsChange: () => void;
}

export function Sidebar({
  loading,
  onSelectConversation,
  onNewConversation,
  onConversationsChange,
}: SidebarProps) {
  const { user, token, logout } = useAuthStore();
  const { conversations, currentConversation, removeConversation } = useChatStore();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    if (!token) return;

    setDeletingId(conversationId);
    try {
      await chatAPI.deleteConversation(token, conversationId);
      removeConversation(conversationId);
      onConversationsChange();
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 text-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <Button
          variant="outline"
          className="w-full justify-start gap-2 border-gray-600 text-white hover:bg-gray-800"
          onClick={onNewConversation}
        >
          <Plus size={18} />
          New Chat
        </Button>
      </div>

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin text-gray-400" size={24} />
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center text-gray-400 py-8 text-sm">
            No conversations yet
          </div>
        ) : (
          <div className="space-y-1">
            {conversations.map((conversation) => (
              <div
                key={conversation._id}
                onClick={() => onSelectConversation(conversation)}
                className={cn(
                  'group flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors',
                  currentConversation?._id === conversation._id
                    ? 'bg-gray-700'
                    : 'hover:bg-gray-800'
                )}
              >
                <MessageSquare size={16} className="flex-shrink-0" />
                <span className="flex-1 truncate text-sm">
                  {conversation.title}
                </span>
                <button
                  onClick={(e) => handleDelete(e, conversation._id)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-600 rounded transition-opacity"
                  disabled={deletingId === conversation._id}
                >
                  {deletingId === conversation._id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User section */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
            <User size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-gray-400 hover:text-white"
          onClick={handleLogout}
        >
          <LogOut size={16} />
          Sign out
        </Button>
      </div>
    </div>
  );
}
