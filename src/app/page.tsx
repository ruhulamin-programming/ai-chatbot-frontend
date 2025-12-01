'use client';

import { useAuthStore } from '@/store/auth';
import { ChatLayout } from '@/components/chat/ChatLayout';
import { LoginForm } from '@/components/auth/LoginForm';
import { useEffect, useState } from 'react';

export default function Home() {
  const { isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  // Handle hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return <ChatLayout />;
}
