
import { useRouter } from "../router/RouterProvider";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar.tsx";
import NebulaShader from "../components/NebulaShader.tsx";

import LandingPage from "../pages/LandingPage";
import Studio from "../pages/Studio";
import Gallery from "../pages/Gallery";
import DashboardLayout from "./DashboardLayout.tsx";

export default function MainLayout() {
  const { currentPath } = useRouter();
  const { user } = useAuth();


return (
  <div className="min-h-screen bg-slate-950 text-white relative">
    <NebulaShader />

    <div className="relative z-20">
      <Navbar />

      {currentPath === "/" && <LandingPage />}

      {currentPath.startsWith("/dashboard") && (
        user ? (
          <DashboardLayout>
            {currentPath === "/dashboard/studio" && <Studio />}
            {currentPath === "/dashboard/gallery" && <Gallery />}
          </DashboardLayout>
        ) : (
          <div className="pt-32 text-center text-white">
            Please sign in to continue.
          </div>
        )
      )}
    </div>
  </div>
);
}
