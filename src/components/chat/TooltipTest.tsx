// src/components/chat/TooltipTest.tsx
"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function TooltipTest() {
  return (
    <div className="p-8">
      <h2 className="text-lg font-bold mb-4">Тест Tooltip</h2>
      
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Наведи мышь на меня
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-gray-900 text-white p-2 rounded">
          <div className="text-sm">
            Это работающий tooltip!
          </div>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}