// User types
export interface User {
  id: string;
  email: string;
  full_name: string;
  created_at?: string;
  updated_at?: string;
}

// Auth Request types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirm_password: string;
  full_name: string;
}

export interface LogoutRequest {
  refresh_token: string;
}

// Auth Response types
export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
}

// API Error type
export interface ApiError {
  detail: string | { msg: string; type: string }[];
}
