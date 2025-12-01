// User interfaces
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt?: string;
}

// Message interface
export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

// Conversation interface
export interface Conversation {
  _id: string;
  userId: string;
  title: string;
  messages: Message[];
  aiModel: string;
  createdAt: string;
  updatedAt: string;
}

// API Response interfaces
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Auth interfaces
export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
}

// Chat interfaces
export interface SendMessageRequest {
  message: string;
  conversationId?: string;
  model?: string;
}

export interface SendMessageResponse {
  conversationId: string;
  message: Message;
}

export interface CreateConversationRequest {
  title?: string;
  model?: string;
}

export interface CreateConversationResponse {
  conversation: {
    id: string;
    title: string;
    model: string;
    createdAt: string;
  };
}

export interface ConversationsResponse {
  conversations: Conversation[];
  pagination: {
    page: number;
    totalPages: number;
    total: number;
  };
}

// WebSocket interfaces
export interface WSMessage {
  type: 'chat' | 'ping' | 'pong' | 'error' | 'auth';
  payload?: unknown;
  conversationId?: string;
  token?: string;
}

export interface WSChatPayload {
  message: string;
  conversationId?: string;
  model?: string;
}

export interface WSChatChunk {
  type: 'chunk';
  content: string;
}

export interface WSChatDone {
  type: 'done';
  conversationId: string;
}

export interface WSAuthPayload {
  success: boolean;
  userId: string;
}

export interface WSErrorPayload {
  error: string;
}
