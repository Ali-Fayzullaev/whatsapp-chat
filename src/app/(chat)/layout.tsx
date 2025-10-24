// src/app/(chat)/layout.tsx
"use client";
import { Suspense } from "react";
import { useParams } from "next/navigation";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SkeletonChat } from "@/components/optimized/SkeletonChat";
import { SkeletonSidebar } from "@/components/optimized/SkeletonSidebar";

interface ChatLayoutProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  chat: React.ReactNode;
}

export default function ChatLayout({ children, sidebar, chat }: ChatLayoutProps) {
  const params = useParams();
  const chatId = params?.chatId as string | undefined;

  return (
    <TooltipProvider>
      <div className="flex h-screen w-full bg-background text-foreground">
        {/* Desktop Layout */}
        <div className="hidden md:flex w-full">
          {/* Sidebar */}
          <aside className="w-[360px] lg:w-[400px] flex-col border-r border-gray-200 dark:border-gray-800">
            <Suspense fallback={<SkeletonSidebar />}>
              {sidebar}
            </Suspense>
          </aside>

          {/* Chat area */}
          <main className="flex-1 flex flex-col">
            <Suspense fallback={<SkeletonChat />}>
              {chat}
            </Suspense>
          </main>
        </div>

        {/* Mobile Layout - показываем или sidebar или chat */}
        <div className="md:hidden w-full">
          {chatId ? (
            <Suspense fallback={<SkeletonChat />}>
              {chat}
            </Suspense>
          ) : (
            <Suspense fallback={<SkeletonSidebar />}>
              {sidebar}
            </Suspense>
          )}
        </div>

        {children}
      </div>
    </TooltipProvider>
  );
}