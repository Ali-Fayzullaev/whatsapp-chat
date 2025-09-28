// src/components/chat/MessageBubble.tsx
"use client";
import { Check, CheckCheck } from "lucide-react";
import type { Message } from "./types";


export function MessageBubble({ msg }: { msg: Message }) {
  const isMe = msg.author === "me";
  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"} mb-2`}>
      <div
        className={[
          "relative max-w-[78%] rounded-2xl px-3 py-2 shadow-sm",
          isMe
            ? "bg-blue-500 text-white rounded-br-md"
            : "bg-white text-gray-900 rounded-bl-md border border-gray-200",
        ].join(" ")}
      >
        <div className="whitespace-pre-wrap break-words pr-10">{msg.text}</div>
        <div
          className={`absolute bottom-1 right-2 flex items-center gap-1 text-[11px] ${
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
              <span>⚠️</span>
            ) : (
              <Check className="h-3 w-3" />
            ))}
        </div>
      </div>
    </div>
  );
}
