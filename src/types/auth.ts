// src/types/auth.ts
export interface LoginRequest {
  username: string;
  password: string;
  full_name: string;
  user_id: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: 'bearer';
}

export interface User {
  username: string;
  full_name?: string;
  user_id?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
}