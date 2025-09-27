import { redirect } from "next/navigation";
import { CHATS } from "@/components/chat/fixtures";

export default function Home() {
  const first = CHATS[0]?.id || "1";
  redirect(`/${first}`);
}
