// src/components/chat/MobileSidebar.tsx
"use client";

import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle 
} from "@/components/ui/sheet";
import { Sidebar } from "./Sidebar";

interface MobileSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  query: string;
  setQuery: (v: string) => void;
  chats: any[];
  selectedId?: string;
  setSelectedId: (id: string) => void;
  onCreateChat: (phone: string) => Promise<void>;
}

export function MobileSidebar({
  open,
  onOpenChange,
  query,
  setQuery,
  chats,
  selectedId,
  setSelectedId,
  onCreateChat
}: MobileSidebarProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="p-0 w-[85vw] max-w-[400px] bb">
        <SheetHeader className="sr-only">
          <SheetTitle>Чаты</SheetTitle>
        </SheetHeader>
        <div className="h-full">
          <Sidebar
            query={query}
            setQuery={setQuery}
            chats={chats}
            selectedId={selectedId}
            setSelectedId={(id) => {
              setSelectedId(id);
              onOpenChange(false); // Закрываем sidebar при выборе чата
            }}
            compact={true}
            onCreateChat={onCreateChat}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}