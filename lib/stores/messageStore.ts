"use client";
// lib/stores/messageStore.ts
// Temporary Zustand store — will be replaced by Server Action calls once DB is connected.

import { create } from "zustand";
import { nanoid } from "nanoid";
import type { Conversation, Message } from "@/lib/types";

interface MessageStore {
  conversations: Conversation[];
  messages: Message[];
  activeConversationId: string | null;

  setConversations: (conversations: Conversation[]) => void;
  setMessages: (messages: Message[]) => void;
  setActiveConversation: (id: string) => void;
  sendMessage: (conversationId: string, text: string, senderId: string, senderName: string) => void;
  markRead: (conversationId: string) => void;
}

export const useMessageStore = create<MessageStore>((set) => ({
  conversations: [],
  messages: [],
  activeConversationId: null,

  setConversations: (conversations) => set({ conversations }),
  setMessages: (messages) => set({ messages }),

  setActiveConversation: (id) =>
    set({ activeConversationId: id }),

  sendMessage: (conversationId, text, senderId, senderName) => {
    const msg: Message = {
      messageId: `MSG-${nanoid(4)}`,
      conversationId,
      senderId,
      senderName,
      text,
      sentAt: new Date().toISOString(),
      isRead: false,
      isOutgoing: true,
    };
    set((state) => ({
      messages: [...state.messages, msg],
      conversations: state.conversations.map((c) =>
        c.conversationId === conversationId
          ? { ...c, lastMessage: text, lastMessageTime: msg.sentAt }
          : c
      ),
    }));
  },

  markRead: (conversationId) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.conversationId === conversationId ? { ...c, unreadCount: 0 } : c
      ),
    })),
}));
