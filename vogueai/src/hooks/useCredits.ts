import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCreditBalance,
  getCreditPackages,
  createRazorpayOrder,
  verifyRazorpayPayment,
  getTransactionHistory,
  checkCredits,
  type CreditBalance,
  type CreditPackage,
  type CreateOrderResponse,
  type VerifyPaymentResponse,
  type TransactionHistoryResponse,
} from "../services/creditsService";
import { getAccessToken } from "../lib/axios";

// Query keys
export const creditsKeys = {
  all: ["credits"] as const,
  balance: () => [...creditsKeys.all, "balance"] as const,
  packages: () => [...creditsKeys.all, "packages"] as const,
  history: () => [...creditsKeys.all, "history"] as const,
  check: (required: number) => [...creditsKeys.all, "check", required] as const,
};

// Hook to get credit balance
export const useCreditBalance = () => {
  return useQuery<CreditBalance, Error>({
    queryKey: creditsKeys.balance(),
    queryFn: getCreditBalance,
    enabled: !!getAccessToken(),
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true,
  });
};

// Hook to get available packages
export const useCreditPackages = () => {
  return useQuery<CreditPackage[], Error>({
    queryKey: creditsKeys.packages(),
    queryFn: getCreditPackages,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to get transaction history
export const useTransactionHistory = (limit: number = 50) => {
  return useQuery<TransactionHistoryResponse, Error>({
    queryKey: creditsKeys.history(),
    queryFn: () => getTransactionHistory(limit),
    enabled: !!getAccessToken(),
    staleTime: 60 * 1000, // 1 minute
  });
};

// Hook to check credits
export const useCheckCredits = (required: number = 1) => {
  return useQuery<{ has_sufficient_credits: boolean; balance: number }, Error>({
    queryKey: creditsKeys.check(required),
    queryFn: () => checkCredits(required),
    enabled: !!getAccessToken(),
    staleTime: 10 * 1000, // 10 seconds
  });
};

// Hook to create Razorpay order
export const useCreateOrder = () => {
  return useMutation<CreateOrderResponse, Error, string>({
    mutationFn: createRazorpayOrder,
  });
};

// Hook to verify Razorpay payment
export const useVerifyPayment = () => {
  const queryClient = useQueryClient();

  return useMutation<
    VerifyPaymentResponse,
    Error,
    { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }
  >({
    mutationFn: ({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) =>
      verifyRazorpayPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature),
    onSuccess: () => {
      // Invalidate balance query to refresh
      queryClient.invalidateQueries({ queryKey: creditsKeys.balance() });
      queryClient.invalidateQueries({ queryKey: creditsKeys.history() });
    },
  });
};

// Hook to refetch balance (useful after operations)
export const useRefreshCredits = () => {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: creditsKeys.balance() });
  };
};
