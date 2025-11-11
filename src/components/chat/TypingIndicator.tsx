// src/components/chat/TypingIndicator.tsx
"use client";
import { memo } from 'react';
import { MessageCircle } from 'lucide-react';

interface TypingUser {
  id: string;
  name: string;
  timestamp: number;
}

interface TypingIndicatorProps {
  typingUsers: TypingUser[];
  isGroup: boolean;
}

export const TypingIndicator = memo(function TypingIndicator({ 
  typingUsers, 
  isGroup 
}: TypingIndicatorProps) {
  if (typingUsers.length === 0) return null;

  const formatTypingText = () => {
    if (!isGroup) {
      // В личных чатах просто "печатает..."
      return "печатает...";
    }

    // В группах показываем кто именно печатает
    const names = typingUsers.map(user => user.name);
    
    if (names.length === 1) {
      return `${names[0]} печатает...`;
    } else if (names.length === 2) {
      return `${names[0]} и ${names[1]} печатают...`;
    } else if (names.length === 3) {
      return `${names[0]}, ${names[1]} и ${names[2]} печатают...`;
    } else {
      return `${names[0]}, ${names[1]} и ещё ${names.length - 2} печатают...`;
    }
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500 dark:text-gray-400 animate-pulse">
      <MessageCircle className="h-4 w-4" />
      <span>{formatTypingText()}</span>
      
      {/* Анимированные точки */}
      <div className="flex gap-1">
        <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
});