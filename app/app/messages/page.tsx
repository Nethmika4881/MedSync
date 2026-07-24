"use client";

import React, { useState } from "react";
import { useMessageStore } from "@/lib/stores/messageStore";
import { useRole, useCurrentUser } from "@/lib/stores/authStore";
import { Card } from "@/components/ui/card";
import { AvatarWithName } from "@/components/catms/AvatarWithName";
import { Send, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MessagesPage() {
  const { conversations, messages, activeConversationId, setActiveConversation, sendMessage, markRead } = useMessageStore();
  const role = useRole();
  const user = useCurrentUser();
  const [inputText, setInputText] = useState("");

  if (!role || !user) return null;

  // Filter conversations where current user is a participant
  const myConversations = conversations.filter(c => c.participants.some(p => p.userId === user.userId));
  
  const activeConv = myConversations.find(c => c.conversationId === (activeConversationId || myConversations[0]?.conversationId));
  const activeMessages = messages.filter(m => m.conversationId === activeConv?.conversationId).sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());

  const handleSend = () => {
    if (!inputText.trim() || !activeConv) return;
    sendMessage(activeConv.conversationId, inputText, user.userId, user.name);
    setInputText("");
  };

  return (
    <div className="h-[calc(100vh-8rem)] animate-fade-in flex flex-col">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Messages</h2>
        <p className="text-slate-500">Communicate with patients and staff securely.</p>
      </div>

      <Card className="flex-1 border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
        {/* Sidebar */}
        <div className="w-full md:w-80 border-r border-slate-200 bg-white flex flex-col">
          <div className="p-4 border-b border-slate-100">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" placeholder="Search messages..." className="w-full h-9 pl-9 pr-4 rounded-xl bg-slate-50 border-transparent text-sm focus:bg-white focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] outline-none transition-all" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {myConversations.map(conv => {
              const otherParticipant = conv.participants.find(p => p.userId !== user.userId) || conv.participants[0];
              const isActive = activeConv?.conversationId === conv.conversationId;
              return (
                <div 
                  key={conv.conversationId}
                  onClick={() => { setActiveConversation(conv.conversationId); markRead(conv.conversationId); }}
                  className={`p-4 cursor-pointer border-b border-slate-50 transition-colors ${isActive ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-semibold text-sm text-slate-900 truncate pr-2">{otherParticipant.name}</p>
                    <span className="text-xs text-slate-400 shrink-0">{new Date(conv.lastMessageTime).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className={`text-sm truncate pr-4 ${conv.unreadCount > 0 ? 'text-slate-900 font-semibold' : 'text-slate-500'}`}>
                      {conv.lastMessage}
                    </p>
                    {conv.unreadCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-[var(--brand-primary)] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chat Area */}
        {activeConv ? (
          <div className="flex-1 flex flex-col bg-slate-50/50">
            {/* Chat Header */}
            <div className="h-16 bg-white border-b border-slate-100 flex items-center px-6 shrink-0">
              {(() => {
                const other = activeConv.participants.find(p => p.userId !== user.userId) || activeConv.participants[0];
                return <AvatarWithName name={other.name} subtitle={other.role} avatarSrc={other.avatar} size="md" />;
              })()}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {activeMessages.map(msg => {
                const isMe = msg.senderId === user.userId;
                return (
                  <div key={msg.messageId} className={`flex flex-col max-w-[75%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                    <div className={`px-4 py-2.5 rounded-2xl text-sm ${isMe ? 'bg-[var(--brand-primary)] text-white rounded-br-sm' : 'bg-white border border-slate-200 text-slate-900 rounded-bl-sm shadow-sm'}`}>
                      {msg.text}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1">{new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                );
              })}
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-slate-200 shrink-0">
              <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-3">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 h-11 px-4 rounded-xl border border-slate-200 text-sm focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] outline-none bg-slate-50 focus:bg-white transition-all"
                />
                <Button type="submit" disabled={!inputText.trim()} className="h-11 px-6 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-secondary)] text-white font-medium">
                  <Send className="w-4 h-4 mr-2" /> Send
                </Button>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
            Select a conversation to view messages.
          </div>
        )}
      </Card>
    </div>
  );
}
