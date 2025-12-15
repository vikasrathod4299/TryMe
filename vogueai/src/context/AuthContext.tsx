
import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { useCurrentUser, useLogout } from "../hooks/useAuth";
import { getAccessToken, clearTokens } from "../lib/axios";
import type { User } from "../types/auth";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  authMode: "login" | "signup";
  openAuthModal: (mode?: "login" | "signup") => void;
  setUser: (user: User | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [user, setUser] = useState<User | null>(null);

  const { data: currentUser, isLoading, isError } = useCurrentUser();
  const logoutMutation = useLogout();

  // Sync user from query
  useEffect(() => {
    if (currentUser) {
      setUser(currentUser);
    } else if (isError || !getAccessToken()) {
      setUser(null);
    }
  }, [currentUser, isError]);

  const openAuthModal = (mode: "login" | "signup" = "login") => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const logout = () => {
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        setUser(null);
        clearTokens();
      },
    });
  };

  const isAuthenticated = !!user && !!getAccessToken();

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        isAuthModalOpen,
        setAuthModalOpen,
        authMode,
        openAuthModal,
        setUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

