const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface FetchOptions extends RequestInit {
  token?: string;
}

export async function fetchAPI<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { token, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'An error occurred');
  }

  return data;
}

// Auth API
export const authAPI = {
  register: (email: string, password: string, name: string) =>
    fetchAPI('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    }),

  login: (email: string, password: string) =>
    fetchAPI('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getMe: (token: string) =>
    fetchAPI('/api/auth/me', {
      method: 'GET',
      token,
    }),
};

// Chat API
export const chatAPI = {
  sendMessage: (
    token: string,
    message: string,
    conversationId?: string,
    model?: string
  ) =>
    fetchAPI('/api/chat/message', {
      method: 'POST',
      token,
      body: JSON.stringify({ message, conversationId, model }),
    }),

  createConversation: (token: string, title?: string, model?: string) =>
    fetchAPI('/api/chat/conversations', {
      method: 'POST',
      token,
      body: JSON.stringify({ title, model }),
    }),

  getConversations: (token: string, page = 1, limit = 20) =>
    fetchAPI(`/api/chat/conversations?page=${page}&limit=${limit}`, {
      method: 'GET',
      token,
    }),

  getConversation: (token: string, conversationId: string) =>
    fetchAPI(`/api/chat/conversations/${conversationId}`, {
      method: 'GET',
      token,
    }),

  updateConversation: (token: string, conversationId: string, title: string) =>
    fetchAPI(`/api/chat/conversations/${conversationId}`, {
      method: 'PATCH',
      token,
      body: JSON.stringify({ title }),
    }),

  deleteConversation: (token: string, conversationId: string) =>
    fetchAPI(`/api/chat/conversations/${conversationId}`, {
      method: 'DELETE',
      token,
    }),
};
