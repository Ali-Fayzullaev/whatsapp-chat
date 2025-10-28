"use client";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

export function TooltipTest() {
  return (
    <div className="p-8 space-y-4">
      <h2 className="text-xl font-bold">Тест Tooltip</h2>
      
      <TooltipProvider>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <Button variant="outline">
              Наведите для tooltip
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="bg-gray-900 text-white p-2 rounded shadow-lg">
            <div className="text-xs">
              Тестовый tooltip работает! 🎉
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip delayDuration={500}>
          <TooltipTrigger asChild>
            <div className="p-4 bg-blue-100 rounded cursor-pointer">
              Тест с div элементом
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="bg-black text-white p-3 rounded-lg shadow-xl">
            <div className="space-y-1 font-mono text-xs">
              <div>Отправитель: Тестовый пользователь</div>
              <div>User ID: test_12345</div>
              <div>Дата: 28.10.2025 14:30:45</div>
              <div>Платформа: whatsapp</div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}