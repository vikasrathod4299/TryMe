
import { X, User, CreditCard } from "lucide-react";
import { useState } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: Props) {
  const [active, setActive] = useState<"general" | "billing">("general");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-4xl h-[500px] bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex">
        {/* Sidebar */}
        <div className="w-64 bg-slate-950/50 border-r border-white/10 p-6">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            Settings
          </h2>

          <button
            onClick={() => setActive("general")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium mb-2 ${
              active === "general"
                ? "bg-violet-600/10 text-violet-400 border border-violet-500/20"
                : "text-slate-400 hover:bg-white/5"
            }`}
          >
            <User size={18} /> General
          </button>

          <button
            onClick={() => setActive("billing")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium mb-2 ${
              active === "billing"
                ? "bg-violet-600/10 text-violet-400 border border-violet-500/20"
                : "text-slate-400 hover:bg-white/5"
            }`}
          >
            <CreditCard size={18} /> Billing
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-8 overflow-y-auto">
          {active === "general" && (
            <div className="space-y-4 animate-in fade-in">
              <h3 className="text-lg font-bold text-white">Profile</h3>

              <input
                type="text"
                defaultValue="Demo User"
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2 text-white"
              />

              <input
                type="email"
                defaultValue="demo@vogueai.com"
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2 text-white"
              />
            </div>
          )}

          {active === "billing" && (
            <div className="space-y-4 animate-in fade-in">
              <h3 className="text-lg font-bold text-white">Current Plan</h3>

              <div className="p-6 rounded-2xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/30">
                <h4 className="text-xl font-bold text-white">Pro Creator</h4>
                <p className="text-violet-300">$29 / month</p>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
}
