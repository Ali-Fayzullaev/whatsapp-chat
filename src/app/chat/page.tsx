// src/app/chat/page.tsx
import { redirect } from "next/navigation";

export default function ChatRedirectPage() {
  // Перенаправляем на route group (chat)
  redirect("/(chat)");
}