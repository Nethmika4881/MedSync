export interface Conversation {
  conversationId: string;
  participants: { userId: string; name: string; avatar: string; role: string }[];
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isArchived: boolean;
}

export interface Message {
  messageId: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  text: string;
  sentAt: string;
  isRead: boolean;
  isOutgoing: boolean;
}

export const conversations: Conversation[] = [
  { conversationId: "CONV-001", participants: [{ userId: "USR-002", name: "Dr. Sarah Mitchell", avatar: "SM", role: "doctor" }, { userId: "USR-003", name: "Abraham Brakering", avatar: "AB", role: "patient" }], lastMessage: "Thanks for checking! I'd prefer October 25th at 2 PM.", lastMessageTime: "2026-07-24T10:30:00", unreadCount: 1, isArchived: false },
  { conversationId: "CONV-002", participants: [{ userId: "USR-004", name: "Jessica Turner", avatar: "JT", role: "receptionist" }, { userId: "USR-003", name: "Abraham Brakering", avatar: "AB", role: "patient" }], lastMessage: "Your appointment has been confirmed for Dec 31st.", lastMessageTime: "2026-07-23T14:20:00", unreadCount: 0, isArchived: false },
  { conversationId: "CONV-003", participants: [{ userId: "USR-002", name: "Dr. Sarah Mitchell", avatar: "SM", role: "doctor" }, { userId: "PAT-007", name: "Maria Santos", avatar: "MS", role: "patient" }], lastMessage: "Please remember to take your Lisinopril every morning.", lastMessageTime: "2026-07-22T09:15:00", unreadCount: 0, isArchived: false },
  { conversationId: "CONV-004", participants: [{ userId: "USR-004", name: "Jessica Turner", avatar: "JT", role: "receptionist" }, { userId: "PAT-001", name: "Michael Brown", avatar: "MB", role: "patient" }], lastMessage: "We have an opening on Thursday at 3 PM.", lastMessageTime: "2026-07-24T10:30:00", unreadCount: 2, isArchived: false },
  { conversationId: "CONV-005", participants: [{ userId: "USR-004", name: "Jessica Turner", avatar: "JT", role: "receptionist" }, { userId: "PAT-005", name: "Daniel Martinez", avatar: "DM", role: "patient" }], lastMessage: "Yes, that's perfect. Thank you so much, Susan.", lastMessageTime: "2026-07-24T10:30:00", unreadCount: 0, isArchived: false },
];

export const messages: Message[] = [
  { messageId: "MSG-001", conversationId: "CONV-001", senderId: "USR-003", senderName: "Abraham Brakering", text: "Hi, I'd like to reschedule my appointment. I've been feeling sick since yesterday, so I won't be able to attend.", sentAt: "2026-07-24T10:30:00", isRead: true, isOutgoing: false },
  { messageId: "MSG-002", conversationId: "CONV-001", senderId: "USR-002", senderName: "Dr. Sarah Mitchell", text: "Hi Abraham! I'm sorry to hear that you're not feeling well. Let me check the available slots so we can reschedule. Here are the available slots:\n1. January 25th at 2 PM\n2. January 27th at 8 AM\n3. January 27th at 4 PM\nDo any of these options work for you?", sentAt: "2026-07-24T10:45:00", isRead: true, isOutgoing: true },
  { messageId: "MSG-003", conversationId: "CONV-001", senderId: "USR-003", senderName: "Abraham Brakering", text: "Thanks for checking! I'd prefer October 25th at 2 PM.", sentAt: "2026-07-24T10:50:00", isRead: false, isOutgoing: false },
  { messageId: "MSG-004", conversationId: "CONV-002", senderId: "USR-004", senderName: "Jessica Turner", text: "Good morning Abraham! Just confirming your upcoming appointment with Dr. Yashfin Jhosof on December 31st at 10:00 AM. Please arrive 10 minutes early.", sentAt: "2026-07-23T14:20:00", isRead: true, isOutgoing: true },
  { messageId: "MSG-005", conversationId: "CONV-003", senderId: "USR-002", senderName: "Dr. Sarah Mitchell", text: "Hi Maria, just a reminder to take your Lisinopril every morning and monitor your blood pressure. Let me know if readings are above 140/90.", sentAt: "2026-07-22T09:15:00", isRead: true, isOutgoing: true },
  { messageId: "MSG-006", conversationId: "CONV-004", senderId: "USR-004", senderName: "Jessica Turner", text: "Hi Michael, we have an opening on Thursday at 3 PM or Friday at 11 AM with Dr. Mitchell. Which would you prefer?", sentAt: "2026-07-24T10:30:00", isRead: false, isOutgoing: true },
];
