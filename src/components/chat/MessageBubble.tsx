// src/components/chat/MessageBubble.tsx
"use client";
import { Check, CheckCheck } from "lucide-react";
import type { Message } from "./types";

export function MessageBubble({ msg }: { msg: Message }) {
  const isMe = msg.author === "me";
  
  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`relative max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
          isMe
            ? "bg-blue-500 text-white rounded-br-md"
            : "bg-gray-100 text-gray-900 rounded-bl-md"
        }`}
      >
        <div className="whitespace-pre-wrap break-words pr-8">{msg.text}</div>
        
        <div className={`absolute bottom-2 right-3 flex items-center gap-1 text-xs ${
          isMe ? "text-blue-100" : "text-gray-500"
        }`}>
          <span>{msg.time}</span>
          {isMe && (
            <span className="ml-1">
              {msg.status === "read" ? (
                <CheckCheck className="h-3 w-3" />
              ) : msg.status === "delivered" ? (
                <CheckCheck className="h-3 w-3" />
              ) : (
                <Check className="h-3 w-3" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}