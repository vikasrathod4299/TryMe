import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { useCreditBalance, useRefreshCredits } from "../hooks/useCredits";
import { useAuth } from "./AuthContext";

interface CreditsContextType {
  balance: number;
  isLoading: boolean;
  isTopUpModalOpen: boolean;
  openTopUpModal: () => void;
  closeTopUpModal: () => void;
  refreshBalance: () => void;
  hasCredits: (required?: number) => boolean;
}

const CreditsContext = createContext<CreditsContextType | null>(null);

export const CreditsProvider = ({ children }: { children: ReactNode }) => {
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  
  const { data: creditData, isLoading, refetch } = useCreditBalance();
  const refreshCredits = useRefreshCredits();

  const balance = creditData?.balance ?? 0;

  const openTopUpModal = useCallback(() => {
    setIsTopUpModalOpen(true);
  }, []);

  const closeTopUpModal = useCallback(() => {
    setIsTopUpModalOpen(false);
  }, []);

  const refreshBalance = useCallback(() => {
    refreshCredits();
    refetch();
  }, [refreshCredits, refetch]);

  const hasCredits = useCallback((required: number = 1) => {
    return balance >= required;
  }, [balance]);

  // Refresh balance when user authenticates
  useEffect(() => {
    if (isAuthenticated) {
      refetch();
    }
  }, [isAuthenticated, refetch]);

  return (
    <CreditsContext.Provider
      value={{
        balance,
        isLoading,
        isTopUpModalOpen,
        openTopUpModal,
        closeTopUpModal,
        refreshBalance,
        hasCredits,
      }}
    >
      {children}
    </CreditsContext.Provider>
  );
};

export const useCredits = () => {
  const context = useContext(CreditsContext);
  if (!context) {
    throw new Error("useCredits must be used within a CreditsProvider");
  }
  return context;
};
