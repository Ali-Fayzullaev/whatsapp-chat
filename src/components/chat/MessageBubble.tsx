"use client";
import { Check, CheckCheck } from "lucide-react";
import type { Message } from "./types";

export function MessageBubble({ msg }: { msg: Message }) {
  const isMe = msg.author === "me";
  return (
    <div className={["flex", isMe ? "justify-end" : "justify-start"].join(" ")}>
      <div
        className={[
          "relative max-w-[88%] md:max-w-[70%] rounded-2xl px-3 py-2 shadow-sm text-sm",
          isMe
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-muted",
        ].join(" ")}
      >
        <div className="whitespace-pre-wrap break-words pr-8">{msg.text}</div>
        <div className="absolute bottom-1 right-2 flex items-center gap-1 opacity-70 text-[10px]">
          <span>{msg.time}</span>
          {isMe ? (
            msg.status === "read" ? (
              <CheckCheck className="h-[14px] w-[14px]" />
            ) : msg.status === "delivered" ? (
              <CheckCheck className="h-[14px] w-[14px]" />
            ) : (
              <Check className="h-[14px] w-[14px]" />
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}
