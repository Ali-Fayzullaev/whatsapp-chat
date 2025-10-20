// src/components/AuthStatusDemo.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/providers/AuthProvider';
import { CheckCircle, XCircle, User, Key } from 'lucide-react';

export function AuthStatusDemo() {
  const { isAuthenticated, user, accessToken } = useAuth();

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Статус аутентификации
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span>Авторизован:</span>
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <Badge variant="default" className="bg-green-500">Да</Badge>
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 text-red-500" />
                <Badge variant="destructive">Нет</Badge>
              </>
            )}
          </div>
        </div>

        {user && (
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-blue-500" />
              <span className="font-medium">Информация о пользователе:</span>
            </div>
            <div className="pl-6 space-y-1 text-sm">
              <div><strong>Username:</strong> {user.username}</div>
              {user.full_name && <div><strong>Full Name:</strong> {user.full_name}</div>}
              {user.user_id && <div><strong>User ID:</strong> {user.user_id}</div>}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t">
          <span>Токен:</span>
          <Badge variant={accessToken ? "default" : "outline"}>
            {accessToken ? 'Есть' : 'Нет'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}