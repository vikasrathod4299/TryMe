import { X, Coins, Sparkles, Check, Loader2, CreditCard } from "lucide-react";
import { useState } from "react";
import { useCredits } from "../context/CreditsContext";
import { useCreditPackages, useCreateOrder, useVerifyPayment } from "../hooks/useCredits";
import { useAuth } from "../context/AuthContext";
import type { CreditPackage } from "../services/creditsService";

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill: {
    name: string;
    email: string;
  };
  theme: {
    color: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export default function TopUpModal() {
  const { isTopUpModalOpen, closeTopUpModal, balance, refreshBalance } = useCredits();
  const { user } = useAuth();
  const { data: packages, isLoading: packagesLoading } = useCreditPackages();
  const createOrder = useCreateOrder();
  const verifyPayment = useVerifyPayment();

  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isTopUpModalOpen) return null;

  const handlePurchase = async () => {
    if (!selectedPackage) return;
    
    setError(null);
    setSuccess(null);
    setIsProcessing(true);

    try {
      // Create order on backend
      const orderData = await createOrder.mutateAsync(selectedPackage);

      // Check if Razorpay script is loaded
      if (!window.Razorpay) {
        throw new Error("Razorpay SDK not loaded. Please refresh the page.");
      }

      // Open Razorpay checkout
      const options: RazorpayOptions = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "VogueAI",
        description: `${orderData.package.name} - ${orderData.package.credits} Credits`,
        order_id: orderData.order_id,
        handler: async (response: RazorpayResponse) => {
          // Verify payment on backend
          try {
            const result = await verifyPayment.mutateAsync({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (result.success) {
              setSuccess(`Payment successful! Added ${result.credits_added} credits.`);
              refreshBalance();
              setTimeout(() => {
                closeTopUpModal();
                setSuccess(null);
              }, 2000);
            } else {
              setError(result.message);
            }
          } catch (err) {
            setError("Payment verification failed. Please contact support.");
          }
          setIsProcessing(false);
        },
        prefill: {
          name: user?.full_name || "",
          email: user?.email || "",
        },
        theme: {
          color: "#7c3aed", // Violet color
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      console.error("Failed to create order:", err);
      setError("Failed to initiate payment. Please try again.");
      setIsProcessing(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={closeTopUpModal}
      />

      {/* Modal */}
      <div className="relative bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg mx-4 overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-amber-500 to-yellow-400 rounded-xl">
              <Coins className="size-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Top Up Credits</h2>
              <p className="text-sm text-white/60">Current balance: {balance} credits</p>
            </div>
          </div>
          <button
            onClick={closeTopUpModal}
            className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-300 text-sm">
              {success}
            </div>
          )}

          {packagesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-8 text-violet-500 animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">
              {packages?.map((pkg: CreditPackage) => (
                <button
                  key={pkg.id}
                  onClick={() => setSelectedPackage(pkg.id)}
                  disabled={isProcessing}
                  className={`w-full p-4 rounded-xl border transition-all ${
                    selectedPackage === pkg.id
                      ? "border-violet-500 bg-violet-500/10"
                      : "border-white/10 hover:border-white/20 bg-white/5"
                  } ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`size-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          selectedPackage === pkg.id
                            ? "border-violet-500 bg-violet-500"
                            : "border-white/30"
                        }`}
                      >
                        {selectedPackage === pkg.id && (
                          <Check className="size-3 text-white" />
                        )}
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{pkg.name}</span>
                          {pkg.popular && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-gradient-to-r from-violet-500 to-pink-500 rounded-full text-white">
                              Popular
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-white/60">
                          <Sparkles className="size-3" />
                          <span>{pkg.credits} credits</span>
                          <span className="text-white/40">•</span>
                          <span>{formatPrice(pkg.price / pkg.credits)}/credit</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-semibold text-white">
                        {formatPrice(pkg.price)}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Info */}
          <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
            <div className="flex items-start gap-3">
              <Sparkles className="size-5 text-violet-400 mt-0.5" />
              <div className="text-sm text-white/70">
                <p className="font-medium text-white/90 mb-1">How credits work</p>
                <p>Each image generation uses 1 credit. Credits never expire and can be used anytime.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 bg-white/5">
          <button
            onClick={handlePurchase}
            disabled={!selectedPackage || isProcessing}
            className="w-full py-3 px-4 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="size-4" />
                Pay with Razorpay
              </>
            )}
          </button>
          <p className="text-center text-xs text-white/40 mt-3">
            Secure payment powered by Razorpay • UPI, Cards, NetBanking
          </p>
        </div>
      </div>
    </div>
  );
}
