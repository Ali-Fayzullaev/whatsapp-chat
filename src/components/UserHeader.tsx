// src/components/UserHeader.tsx
"use client";

import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { LogOut, User, Settings, ChevronDown } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { DEFAULT_USER_AVATAR } from '@/lib/avatar-assets';

export function UserHeader() {
  const { user, logout, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const displayName = user.full_name || user.username || 'Пользователь';
  const avatarSrc = DEFAULT_USER_AVATAR;

  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="flex items-center gap-3">
        <img
          src={avatarSrc}
          alt={displayName}
          className="h-10 w-10 rounded-full object-cover border border-gray-200 dark:border-gray-700"
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = DEFAULT_USER_AVATAR;
          }}
        />
        
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate">
            {displayName}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
            @{user.username || 'unknown'}
          </div>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-muted">
          <div className="flex items-center gap-2 p-2">
            <img
              src={avatarSrc}
              alt={displayName}
              className="h-8 w-8 rounded-full object-cover border border-gray-200 dark:border-gray-700"
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = DEFAULT_USER_AVATAR;
              }}
            />
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{displayName}</p>
              <p className="text-xs leading-none text-muted-foreground">
                ID: {user.user_id || 'N/A'}
              </p>
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            <span>Профиль</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            <span>Настройки</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-red-600 dark:text-red-400">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Выйти</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}