import { Sparkles, Image as ImageIcon, LogOut, Menu, X, Coins } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCredits } from "../context/CreditsContext";
import { useRouter } from "../router/RouterProvider";
import { useEffect, useState } from "react";

const menuItems = [
  { name: "Features", href: "#features" },
  { name: "Pricing", href: "#pricing" },
  { name: "FAQ", href: "#faq" },
  { name: "Contact", href: "#contact" },
];

export default function Navbar() {
  const { user, logout, openAuthModal } = useAuth();
  const { balance, openTopUpModal } = useCredits();
  const { navigate, currentPath } = useRouter();
  const [menuState, setMenuState] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const isDashboard = currentPath.startsWith("/dashboard");

  const dashboardTabs = [
    { path: "/dashboard/studio", label: "Studio", icon: Sparkles },
    { path: "/dashboard/gallery", label: "Gallery", icon: ImageIcon },
  ];

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleMenuClick = (href: string) => {
    setMenuState(false);
    if (href.startsWith("#")) {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  return (
    <header>
      <nav data-state={menuState && "active"} className="fixed z-50 w-full px-2">
        <div
          className={`mx-auto mt-2 transition-all duration-300 ${
            isScrolled
              ? "max-w-4xl bg-slate-950/80 rounded-2xl border border-white/10 backdrop-blur-lg px-5"
              : "max-w-6xl px-6 lg:px-12"
          }`}
        >
          <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
            {/* Left: Logo & Mobile Menu */}
            <div className="flex w-full justify-between lg:w-auto">
              <div
                onClick={() => navigate(user ? "/dashboard/studio" : "/")}
                className="flex items-center gap-2 cursor-pointer"
              >
                <div className="size-9 bg-gradient-to-tr from-violet-600 to-cyan-400 rounded-xl flex items-center justify-center">
                  <Sparkles className="text-white size-5" />
                </div>
                <span className="text-lg font-bold text-white">VogueAI</span>
              </div>

              <button
                onClick={() => setMenuState(!menuState)}
                aria-label={menuState ? "Close Menu" : "Open Menu"}
                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden"
              >
                <Menu
                  className={`size-6 text-white transition-all duration-200 ${
                    menuState ? "rotate-180 scale-0 opacity-0" : ""
                  }`}
                />
                <X
                  className={`absolute inset-0 m-auto size-6 text-white transition-all duration-200 ${
                    menuState ? "rotate-0 scale-100 opacity-100" : "-rotate-180 scale-0 opacity-0"
                  }`}
                />
              </button>
            </div>

            {/* Center: Navigation Links (Desktop) */}
            <div className="absolute inset-0 m-auto hidden size-fit lg:block">
              {user && isDashboard ? (
                <ul className="flex gap-6 text-sm">
                  {dashboardTabs.map((tab) => {
                    const isActive = currentPath === tab.path;
                    const Icon = tab.icon;
                    return (
                      <li key={tab.path}>
                        <button
                          onClick={() => navigate(tab.path)}
                          className={`flex items-center gap-2 transition-colors duration-150 cursor-pointer ${
                            isActive ? "text-white" : "text-white/60 hover:text-white"
                          }`}
                        >
                          <Icon size={16} />
                          <span>{tab.label}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <ul className="flex gap-8 text-sm">
                  {menuItems.map((item, index) => (
                    <li key={index}>
                      <button
                        onClick={() => handleMenuClick(item.href)}
                        className="text-white/60 hover:text-white transition-colors duration-150 cursor-pointer"
                      >
                        <span>{item.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Right: Auth Buttons & Mobile Menu */}
            <div
              className={`bg-slate-900 lg:bg-transparent mb-6 w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border border-white/10 lg:border-transparent p-6 shadow-2xl shadow-black/20 lg:shadow-none md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:p-0 ${
                menuState ? "block" : "hidden lg:flex"
              }`}
            >
              {/* Mobile Menu Links */}
              <div className="lg:hidden">
                {user && isDashboard ? (
                  <ul className="space-y-6 text-base">
                    {dashboardTabs.map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <li key={tab.path}>
                          <button
                            onClick={() => {
                              navigate(tab.path);
                              setMenuState(false);
                            }}
                            className="text-white/60 hover:text-white flex items-center gap-2 transition-colors duration-150 cursor-pointer"
                          >
                            <Icon size={16} />
                            <span>{tab.label}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <ul className="space-y-6 text-base">
                    {menuItems.map((item, index) => (
                      <li key={index}>
                        <button
                          onClick={() => handleMenuClick(item.href)}
                          className="text-white/60 hover:text-white transition-colors duration-150 cursor-pointer"
                        >
                          <span>{item.name}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Auth Buttons */}
              <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit">
                {!user ? (
                  <>
                    <button
                      onClick={() => openAuthModal("login")}
                      className={`px-4 py-2 text-sm text-white border border-white/20 hover:border-white/40 rounded-lg transition-all ${
                        isScrolled ? "lg:hidden" : ""
                      }`}
                    >
                      Login
                    </button>
                    <button
                      onClick={() => openAuthModal("signup")}
                      className={`px-4 py-2 text-sm font-medium bg-white text-slate-900 hover:bg-white/90 rounded-lg transition-all ${
                        isScrolled ? "lg:hidden" : ""
                      }`}
                    >
                      Sign Up
                    </button>
                    <button
                      onClick={() => openAuthModal("signup")}
                      className={`px-4 py-2 text-sm font-medium bg-white text-slate-900 hover:bg-white/90 rounded-lg transition-all ${
                        isScrolled ? "lg:inline-flex" : "hidden"
                      }`}
                    >
                      Get Started
                    </button>
                  </>
                ) : (
                  <div className="flex items-center gap-3">
                    {/* Credits Display */}
                    <button
                      onClick={openTopUpModal}
                      className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30 hover:border-amber-500/50 rounded-full transition-all cursor-pointer"
                      title="Top up credits"
                    >
                      <Coins className="size-4 text-amber-400" />
                      <span className="text-sm font-medium text-amber-300">{balance}</span>
                    </button>
                    
                    {/* User Profile */}
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full">
                      <div className="size-5 rounded-full bg-gradient-to-r from-pink-500 to-violet-500" />
                      <span className="text-sm text-white/80">{user.full_name}</span>
                    </div>
                    <button
                      onClick={() => {
                        logout();
                        navigate("/");
                        setMenuState(false);
                      }}
                      className="p-2 text-white/50 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                      title="Sign Out"
                    >
                      <LogOut size={18} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}