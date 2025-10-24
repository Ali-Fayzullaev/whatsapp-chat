import { redirect } from "next/navigation";

export default function Home() {
  // Перенаправляем на оптимизированный интерфейс чатов
  redirect("/chat");
}
