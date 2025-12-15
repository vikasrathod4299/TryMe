
import { X, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "../router/RouterProvider";
import { useState, useEffect } from "react";
import { useLogin, useRegister } from "../hooks/useAuth";
import { AxiosError } from "axios";

interface FormData {
  full_name: string;
  email: string;
  password: string;
  confirm_password: string;
}

interface ApiErrorResponse {
  detail: string | { msg: string; loc: string[] }[];
}

export default function AuthModal() {
  const { isAuthModalOpen, setAuthModalOpen, authMode, setUser } = useAuth();
  const { navigate } = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    full_name: "",
    email: "",
    password: "",
    confirm_password: "",
  });

  const loginMutation = useLogin();
  const registerMutation = useRegister();

  const isLoading = loginMutation.isPending || registerMutation.isPending;

  // Sync isSignUp with authMode when modal opens
  useEffect(() => {
    if (isAuthModalOpen) {
      setIsSignUp(authMode === "signup");
      setError(null);
      setFormData({
        full_name: "",
        email: "",
        password: "",
        confirm_password: "",
      });
    }
  }, [isAuthModalOpen, authMode]);

  if (!isAuthModalOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const parseError = (error: AxiosError<ApiErrorResponse>): string => {
    if (error.response?.data?.detail) {
      const detail = error.response.data.detail;
      if (typeof detail === "string") {
        return detail;
      }
      if (Array.isArray(detail) && detail.length > 0) {
        return detail[0].msg;
      }
    }
    return "Something went wrong. Please try again.";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isSignUp) {
      // Validate passwords match
      if (formData.password !== formData.confirm_password) {
        setError("Passwords do not match");
        return;
      }

      registerMutation.mutate(
        {
          full_name: formData.full_name,
          email: formData.email,
          password: formData.password,
          confirm_password: formData.confirm_password,
        },
        {
          onSuccess: (data) => {
            setUser(data.user);
            setAuthModalOpen(false);
            navigate("/dashboard/studio");
          },
          onError: (error) => {
            setError(parseError(error as AxiosError<ApiErrorResponse>));
          },
        }
      );
    } else {
      loginMutation.mutate(
        {
          email: formData.email,
          password: formData.password,
        },
        {
          onSuccess: (data) => {
            setUser(data.user);
            setAuthModalOpen(false);
            navigate("/dashboard/studio");
          },
          onError: (error) => {
            setError(parseError(error as AxiosError<ApiErrorResponse>));
          },
        }
      );
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={() => setAuthModalOpen(false)}
      />

      <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl animate-fade-in zoom-in-95 duration-300">
        <button
          onClick={() => setAuthModalOpen(false)}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X size={20} />
        </button>

        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">
              {isSignUp ? "Create Account" : "Welcome Back"}
            </h2>
            <p className="text-slate-400 text-sm">
              {isSignUp
                ? "Join VogueAI to transform your style with AI."
                : "Sign in to access your virtual wardrobe."}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                placeholder="Full Name"
                required
                minLength={1}
                maxLength={100}
                className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50 transition-colors"
              />
            )}
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Email"
              required
              className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50 transition-colors"
            />
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Password"
              required
              minLength={8}
              className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50 transition-colors"
            />
            {isSignUp && (
              <input
                type="password"
                name="confirm_password"
                value={formData.confirm_password}
                onChange={handleInputChange}
                placeholder="Confirm Password"
                required
                minLength={8}
                className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50 transition-colors"
              />
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold py-3 rounded-xl flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" />
              ) : isSignUp ? (
                "Create Account"
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-400">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="text-violet-400 hover:text-violet-300 transition-colors"
            >
              {isSignUp
                ? "Already have an account? Sign In"
                : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
