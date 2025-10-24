// src/app/(chat)/@chat/[chatId]/page.tsx
"use client";
import { Suspense, use } from "react";
import { OptimizedChat } from "@/components/optimized/OptimizedChat";
import { SkeletonChat } from "@/components/optimized/SkeletonChat";

interface ChatPageProps {
  params: Promise<{
    chatId: string;
  }>;
}

export default function ChatPage({ params }: ChatPageProps) {
  const { chatId } = use(params);

  return (
    <Suspense fallback={<SkeletonChat />}>
      <OptimizedChat chatId={chatId} />
    </Suspense>
  );
}