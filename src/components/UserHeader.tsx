// src/components/UserHeader.tsx
"use client";

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { LogOut, User, Settings, ChevronDown } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { WebSocketStatusIndicator } from './WebSocketStatusIndicator';

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

  const userInitials = (user.full_name || user.username || 'U')
    .split(' ')
    .map(name => name.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage 
            src={`https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(user.full_name || user.username || 'User')}`} 
            alt={user.full_name || user.username || 'Пользователь'} 
          />
          <AvatarFallback className="bg-green-500 text-white">
            {userInitials}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate">
            {user.full_name || user.username || 'Пользователь'}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
            @{user.username || 'unknown'}
          </div>
          <div className="mt-1">
            <WebSocketStatusIndicator />
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
            <Avatar className="h-8 w-8">
              <AvatarImage 
                src={`https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(user.full_name || user.username || 'User')}`} 
                alt={user.full_name || user.username || 'Пользователь'} 
              />
              <AvatarFallback className="bg-green-500 text-white text-xs">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.full_name || user.username || 'Пользователь'}</p>
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