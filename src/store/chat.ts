import { create } from "zustand";
import type { Conversation, Message } from "@/types";

interface ChatState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  isStreaming: boolean;
  streamingContent: string;
  setConversations: (conversations: Conversation[]) => void;
  setCurrentConversation: (conversation: Conversation | null) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  removeConversation: (id: string) => void;
  addMessage: (conversationId: string, message: Message) => void;
  setIsStreaming: (isStreaming: boolean) => void;
  setStreamingContent: (content: string) => void;
  appendStreamingContent: (content: string) => void;
  clearStreamingContent: () => void;
}

export const useChatStore = create<ChatState>()((set) => ({
  conversations: [],
  currentConversation: null,
  isStreaming: false,
  streamingContent: "",

  setConversations: (conversations) => set({ conversations }),

  setCurrentConversation: (conversation) =>
    set({ currentConversation: conversation }),

  addConversation: (conversation) =>
    set((state) => ({
      conversations: [conversation, ...state.conversations],
    })),

  updateConversation: (id, updates) =>
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv._id === id ? { ...conv, ...updates } : conv
      ),
      currentConversation:
        state.currentConversation?._id === id
          ? { ...state.currentConversation, ...updates }
          : state.currentConversation,
    })),

  removeConversation: (id) =>
    set((state) => ({
      conversations: state.conversations.filter((conv) => conv._id !== id),
      currentConversation:
        state.currentConversation?._id === id
          ? null
          : state.currentConversation,
    })),

  // addMessage: (conversationId, message) =>
  //   set((state) => ({
  //     conversations: state.conversations.map((conv) =>
  //       conv._id === conversationId
  //         ? { ...conv, messages: [...conv.messages, message] }
  //         : conv
  //     ),
  //     currentConversation:
  //       state.currentConversation?._id === conversationId
  //         ? {
  //             ...state.currentConversation,
  //             messages: [...state.currentConversation.messages, message],
  //           }
  //         : state.currentConversation,
  //   })),

  addMessage: (conversationId, message) =>
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv._id === conversationId
          ? {
              ...conv,
              messages: [...(conv.messages || []), message],
            }
          : conv
      ),
      currentConversation:
        state.currentConversation?._id === conversationId
          ? {
              ...state.currentConversation,
              messages: [
                ...(state.currentConversation.messages || []),
                message,
              ],
            }
          : state.currentConversation,
    })),

  setIsStreaming: (isStreaming) => set({ isStreaming }),

  setStreamingContent: (content) => set({ streamingContent: content }),

  appendStreamingContent: (content) =>
    set((state) => ({ streamingContent: state.streamingContent + content })),

  clearStreamingContent: () => set({ streamingContent: "" }),
}));
