
import { Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "../router/RouterProvider";
import { useEffect, useState } from "react";

export default function Navbar() {
  const { user, setAuthModalOpen } = useAuth();
  const { navigate } = useRouter();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed w-full z-40 transition-all ${
        scrolled
          ? "bg-slate-950/80 backdrop-blur-md border-b border-white/10 py-4"
          : "py-6"
      }`}
    >
      <div className="container mx-auto px-6 flex justify-between items-center">
        <div
          onClick={() => navigate("/")}
          className="flex items-center gap-2 cursor-pointer"
        >
          <div className="size-10 bg-gradient-to-tr from-violet-600 to-cyan-400 rounded-xl flex items-center justify-center">
            <Sparkles className="text-white size-6" />
          </div>
          <span className="text-xl font-bold text-white">VogueAI</span>
        </div>

        {!user ? (
          <div className="hidden md:flex gap-6">
            <button
              onClick={() => setAuthModalOpen(true)}
              className="px-5 py-2 bg-white/10 rounded-full text-white"
            >
              Sign In
            </button>
            <button
              onClick={() => setAuthModalOpen(true)}
              className="px-5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full text-white"
            >
              Get Started
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-full">
            <div className="size-6 rounded-full bg-gradient-to-r from-pink-500 to-violet-500" />
            <span>{user.name}</span>
          </div>
        )}
      </div>
    </nav>
  );
}
