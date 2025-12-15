
import { useRouter } from "../router/RouterProvider";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar.tsx";
import NebulaShader from "../components/NebulaShader.tsx";
import AuthModal from "../modals/AuthModal.tsx";

import LandingPage from "../pages/LandingPage";
import Studio from "../pages/Studio";
import Gallery from "../pages/Gallery";
import DashboardLayout from "./DashboardLayout.tsx";
import { Loader2 } from "lucide-react";

export default function MainLayout() {
  const { currentPath } = useRouter();
  const { user, isLoading } = useAuth();

  // Show loading state while checking auth
  const renderDashboardContent = () => {
    if (isLoading) {
      return (
        <div className="pt-32 flex justify-center">
          <Loader2 className="size-8 animate-spin text-violet-500" />
        </div>
      );
    }

    if (!user) {
      return (
        <div className="pt-32 text-center text-white">
          Please sign in to continue.
        </div>
      );
    }

    return (
      <DashboardLayout>
        {currentPath === "/dashboard/studio" && <Studio />}
        {currentPath === "/dashboard/gallery" && <Gallery />}
      </DashboardLayout>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white relative">
      <NebulaShader />
      <AuthModal />

      <div className="relative z-20">
        <Navbar />

        {currentPath === "/" && <LandingPage />}

        {currentPath.startsWith("/dashboard") && renderDashboardContent()}
      </div>
    </div>
  );
}
