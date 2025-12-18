import { protectedApi, publicApi } from "../lib/axios";

// Types
export interface CreditBalance {
  balance: number;
  total_purchased: number;
  total_used: number;
}

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  currency: string;
  popular: boolean;
}

export interface PackagesResponse {
  packages: CreditPackage[];
}

export interface CreateOrderRequest {
  package_id: string;
}

export interface CreateOrderResponse {
  order_id: string;
  amount: number;
  currency: string;
  key_id: string;
  package: {
    id: string;
    name: string;
    credits: number;
    price: number;
  };
}

export interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  credits_added: number;
  new_balance: number;
  message: string;
}

export interface CreditTransaction {
  id: string;
  type: "purchase" | "usage" | "bonus" | "refund";
  amount: number;
  balance_after: number;
  price_paid: number | null;
  currency: string | null;
  status: "pending" | "completed" | "failed" | "refunded";
  description: string | null;
  created_at: string;
}

export interface TransactionHistoryResponse {
  transactions: CreditTransaction[];
  total: number;
}

// Get credit balance
export const getCreditBalance = async (): Promise<CreditBalance> => {
  const response = await protectedApi.get<CreditBalance>("/credits/balance");
  return response.data;
};

// Get available packages
export const getCreditPackages = async (): Promise<CreditPackage[]> => {
  const response = await publicApi.get<PackagesResponse>("/credits/packages");
  return response.data.packages;
};

// Create Razorpay order
export const createRazorpayOrder = async (packageId: string): Promise<CreateOrderResponse> => {
  const response = await protectedApi.post<CreateOrderResponse>("/credits/create-order", {
    package_id: packageId,
  });
  return response.data;
};

// Verify Razorpay payment
export const verifyRazorpayPayment = async (
  razorpay_order_id: string,
  razorpay_payment_id: string,
  razorpay_signature: string
): Promise<VerifyPaymentResponse> => {
  const response = await protectedApi.post<VerifyPaymentResponse>("/credits/verify-payment", {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  });
  return response.data;
};

// Get transaction history
export const getTransactionHistory = async (limit: number = 50): Promise<TransactionHistoryResponse> => {
  const response = await protectedApi.get<TransactionHistoryResponse>(`/credits/history?limit=${limit}`);
  return response.data;
};

// Check if user has sufficient credits
export const checkCredits = async (required: number = 1): Promise<{ has_sufficient_credits: boolean; balance: number }> => {
  const response = await protectedApi.get<{ has_sufficient_credits: boolean; balance: number }>(
    `/credits/check?required=${required}`
  );
  return response.data;
};
