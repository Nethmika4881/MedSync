"use client";
import { create } from "zustand";
import { conversations as initialConvs, messages as initialMessages, type Conversation, type Message } from "@/lib/mockData/messages";
import { nanoid } from "nanoid";

interface MessageStore {
  conversations: Conversation[];
  messages: Message[];
  activeConversationId: string | null;

  setActiveConversation: (id: string) => void;
  sendMessage: (conversationId: string, text: string, senderId: string, senderName: string) => void;
  markRead: (conversationId: string) => void;
}

export const useMessageStore = create<MessageStore>((set) => ({
  conversations: initialConvs,
  messages: initialMessages,
  activeConversationId: null,

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
