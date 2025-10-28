"use client";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ContextMenu } from "@/components/ui/context-menu";
import { Button } from "@/components/ui/button";
import { Reply, Forward, Copy, Trash2 } from "lucide-react";

export function TooltipTest() {
  return (
    <div className="p-8 space-y-4">
      <h2 className="text-xl font-bold">Тест Tooltip и ContextMenu</h2>
      
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
        <ContextMenu
          menuItems={[
            {
              label: 'Ответить',
              action: () => console.log('Ответить clicked'),
              icon: <Reply className="h-4 w-4" />
            },
            {
              label: 'Копировать',
              action: () => console.log('Копировать clicked'),
              icon: <Copy className="h-4 w-4" />
            },
            {
              label: 'Удалить для меня',
              action: () => console.log('Удалить для меня clicked'),
              className: 'text-orange-600 focus:bg-orange-50',
              icon: <Trash2 className="h-4 w-4" />
            },
            {
              label: 'Удалить у всех',
              action: () => console.log('Удалить у всех clicked'),
              className: 'text-red-600 focus:bg-red-50',
              icon: <Trash2 className="h-4 w-4" />
            }
          ]}
        >
          <Tooltip delayDuration={500}>
            <TooltipTrigger asChild>
              <div className="p-4 bg-green-100 rounded cursor-pointer select-none">
                Правая кнопка для ContextMenu, наведение для Tooltip
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
        </ContextMenu>
      </TooltipProvider>
    </div>
  );
}