// src/components/chat/MessageBubble.tsx
"use client";
import { Check, CheckCheck } from "lucide-react";
import type { Message } from "./types";

export function MessageBubble({ msg }: { msg: Message }) {
  const isMe = msg.author === "me";
  
  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={[
          "relative max-w-[85%] rounded-2xl px-4 py-3 shadow-sm",
          isMe
            ? "bg-blue-500 text-white rounded-br-md"
            : "bg-white text-gray-900 rounded-bl-md border border-gray-200",
        ].join(" ")}
      >
        <div className="whitespace-pre-wrap break-words pr-12">{msg.text}</div>
        <div
          className={`absolute bottom-2 right-3 flex items-center gap-1 text-xs ${
            isMe ? "text-blue-100" : "text-gray-500"
          }`}
        >
          <span>{msg.time}</span>
          {isMe &&
            (msg.status === "read" ? (
              <CheckCheck className="h-3 w-3" />
            ) : msg.status === "delivered" ? (
              <CheckCheck className="h-3 w-3 opacity-75" />
            ) : msg.status === "failed" ? (
              <span className="text-red-300">⚠️</span>
            ) : (
              <Check className="h-3 w-3" />
            ))}
        </div>
      </div>
    </div>
  );
}