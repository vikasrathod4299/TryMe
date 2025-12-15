import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { loginUser, registerUser, logoutUser, getCurrentUser } from "../services/authService";
import type { LoginRequest, RegisterRequest, AuthResponse, User } from "../types/auth";
import { getAccessToken } from "../lib/axios";

// Query keys
export const authKeys = {
  all: ["auth"] as const,
  user: () => [...authKeys.all, "user"] as const,
};

// Hook to get current user
export const useCurrentUser = () => {
  return useQuery<User, Error>({
    queryKey: authKeys.user(),
    queryFn: getCurrentUser,
    enabled: !!getAccessToken(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });
};

// Hook for login
export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation<AuthResponse, Error, LoginRequest>({
    mutationFn: loginUser,
    onSuccess: (data) => {
      // Set user data in cache
      queryClient.setQueryData(authKeys.user(), data.user);
    },
    onError: (error) => {
      console.error("Login error:", error);
    },
  });
};

// Hook for register
export const useRegister = () => {
  const queryClient = useQueryClient();

  return useMutation<AuthResponse, Error, RegisterRequest>({
    mutationFn: registerUser,
    onSuccess: (data) => {
      // Set user data in cache
      queryClient.setQueryData(authKeys.user(), data.user);
    },
    onError: (error) => {
      console.error("Register error:", error);
    },
  });
};

// Hook for logout
export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error>({
    mutationFn: logoutUser,
    onSuccess: () => {
      // Clear all auth-related queries
      queryClient.removeQueries({ queryKey: authKeys.all });
      queryClient.clear();
    },
  });
};
