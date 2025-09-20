export type Chat = {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread?: number;
  avatarUrl?: string;
  avatarFallback?: string;
};

export type Message = {
  id: string;
  chatId: string;
  author: "me" | "them";
  text: string;
  time: string;
  status?: "sent" | "delivered" | "read";
};
