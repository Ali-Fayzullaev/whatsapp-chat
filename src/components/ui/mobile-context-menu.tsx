// src/components/ui/mobile-context-menu.tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface MenuItem {
  label: string;
  action: () => void;
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
}

interface MobileContextMenuProps {
  menuItems: MenuItem[];
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function MobileContextMenu({ menuItems, isOpen, onClose, children }: MobileContextMenuProps) {
  React.useEffect(() => {
    if (isOpen) {
      // Блокируем скролл когда меню открыто
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleItemClick = (item: MenuItem) => {
    item.action();
    onClose();
  };

  return (
    <>
      {children}
      
      {/* Мобильное контекстное меню */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Затемненный фон */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Меню снизу */}
          <div className="absolute my-20 mx-5 bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-2 duration-300">
            
            {/* Пункты меню */}
            <div>
              {menuItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleItemClick(item)}
                  disabled={item.disabled}
                  className={cn(
                    "w-full flex items-center gap-3 p-4 text-left rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                    "hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600",
                    item.className
                  )}
                >
                  {item.icon && (
                    <span className="flex-shrink-0">
                      {item.icon}
                    </span>
                  )}
                  <span className="text-base font-medium">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
            
            {/* Отступ снизу для безопасной области */}
            <div className="h-6" />
          </div>
        </div>
      )}
    </>
  );
}