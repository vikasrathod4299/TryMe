import { publicApi, protectedApi, setTokens, clearTokens, getRefreshToken } from "../lib/axios";
import type { LoginRequest, RegisterRequest, AuthResponse, User } from "../types/auth";

// API response wrapper type
interface ApiResponse<T> {
  message: string;
  data: T;
}

// Login user
export const loginUser = async (data: LoginRequest): Promise<AuthResponse> => {
  const response = await publicApi.post<ApiResponse<AuthResponse>>("/auth/login", data);
  const authData = response.data.data;
  setTokens(authData.access_token, authData.refresh_token);
  return authData;
};

// Register user
export const registerUser = async (data: RegisterRequest): Promise<AuthResponse> => {
  const response = await publicApi.post<ApiResponse<AuthResponse>>("/auth/register", data);
  const authData = response.data.data;
  setTokens(authData.access_token, authData.refresh_token);
  return authData;
};

// Logout user
export const logoutUser = async (): Promise<void> => {
  const refreshToken = getRefreshToken();
  if (refreshToken) {
    try {
      await protectedApi.post("/auth/logout", { refresh_token: refreshToken });
    } catch (error) {
      // Ignore logout errors
      console.error("Logout error:", error);
    }
  }
  clearTokens();
};

// Get current user profile
export const getCurrentUser = async (): Promise<User> => {
  const response = await protectedApi.get<ApiResponse<User>>("/user/me");
  return response.data.data;
};

// Refresh token
export const refreshToken = async (refresh_token: string): Promise<AuthResponse> => {
  const response = await publicApi.post<AuthResponse>("/auth/refresh", { refresh_token });
  const { access_token, refresh_token: newRefreshToken } = response.data;
  setTokens(access_token, newRefreshToken);
  return response.data;
};
