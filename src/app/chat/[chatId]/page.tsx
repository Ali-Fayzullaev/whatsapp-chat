// src/app/chat/[chatId]/page.tsx
import { redirect } from "next/navigation";
import { use } from "react";

interface ChatPageProps {
  params: Promise<{
    chatId: string;
  }>;
}

export default function ChatPageRedirect({ params }: ChatPageProps) {
  const { chatId } = use(params);
  // Перенаправляем на route group (chat) с chatId
  redirect(`/(chat)/${encodeURIComponent(chatId)}`);
}