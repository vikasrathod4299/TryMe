
import { LogOut, Settings, Sparkles, Image as ImageIcon } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "../router/RouterProvider";
import Link from "../components/Link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { logout } = useAuth();
  const { navigate } = useRouter();

  return (
    <div className="min-h-screen pt-24 px-6 relative z-30">
      <div className="max-w-7xl mx-auto mb-10 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>

        <div className="flex gap-2 bg-slate-900/60 p-1 rounded-xl border border-white/10">
          <Link
            to="/dashboard/studio"
            className="px-5 py-2 rounded-lg"
            activeClassName="bg-violet-600 text-white"
            inactiveClassName="text-white/60 hover:bg-white/10"
          >
            <Sparkles size={16} /> Studio
          </Link>

          <Link
            to="/dashboard/gallery"
            className="px-5 py-2 rounded-lg"
            activeClassName="bg-violet-600 text-white"
            inactiveClassName="text-white/60 hover:bg-white/10"
          >
            <ImageIcon size={16} /> Gallery
          </Link>
        </div>

        <button
          onClick={() => {
            logout();
            navigate("/");
          }}
          className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg"
        >
          <LogOut />
        </button>
      </div>

      <div className="max-w-7xl mx-auto">{children}</div>
    </div>
  );
}
