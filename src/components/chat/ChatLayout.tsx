'use client';

import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './Sidebar';
import { ChatArea } from './ChatArea';
import { useAuthStore } from '@/store/auth';
import { useChatStore } from '@/store/chat';
import { chatAPI } from '@/lib/api';
import type { ApiResponse, Conversation, ConversationsResponse } from '@/types';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function ChatLayout() {
  const { token } = useAuthStore();
  const { setConversations, setCurrentConversation } = useChatStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  const loadConversations = useCallback(async () => {
    if (!token) return;
    
    try {
      const response = await chatAPI.getConversations(token) as ApiResponse<ConversationsResponse>;
      if (response.success && response.data) {
        setConversations(response.data.conversations);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [token, setConversations]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const handleSelectConversation = useCallback(async (conversation: Conversation) => {
    if (!token) return;
    
    try {
      const response = await chatAPI.getConversation(token, conversation._id) as ApiResponse<{ conversation: Conversation }>;
      if (response.success && response.data) {
        setCurrentConversation(response.data.conversation);
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  }, [token, setCurrentConversation]);

  const handleNewConversation = useCallback(() => {
    setCurrentConversation(null);
  }, [setCurrentConversation]);

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="bg-white dark:bg-gray-800 shadow-md"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          lg:w-80 w-80
        `}
      >
        <Sidebar
          loading={loading}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          onConversationsChange={loadConversations}
        />
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        <ChatArea onConversationsChange={loadConversations} />
      </div>
    </div>
  );
}
