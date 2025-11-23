
import { X, Loader2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "../../router/RouterContext";
import { useState } from "react";

export default function AuthModal() {
  const { isAuthModalOpen, setAuthModalOpen, login } = useAuth();
  const { navigate } = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      login();
      setAuthModalOpen(false);
      navigate("/dashboard/studio");
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={() => setAuthModalOpen(false)}
      />

      <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
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
              Sign in to access your virtual wardrobe.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-3 px-4 text-white"
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-3 px-4 text-white"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center"
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : isSignUp ? (
                "Sign Up"
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-400">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-violet-400 hover:text-violet-300"
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
