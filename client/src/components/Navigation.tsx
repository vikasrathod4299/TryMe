import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Home, Images, User, LogOut, Settings, Sparkles } from "lucide-react";
import AuthDialog from "./AuthDialog";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { logout } from "@/service/auth";
import { toast } from "sonner";

const Navigation = () => {
  const { user } = useAuth();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const location = useLocation();
  const currentPath = location.pathname;
  const navigate = useNavigate()

  const {mutate:signOutFn } = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      localStorage.removeItem("user");
      window.location.href = "/";
    },
    onError: (error: any) => {
      console.error("Logout failed:", error);
      toast.error("Logout failed. Please try again.");
    },
  })

  const handleSignOut = () => {
    if(user?.refresh_token){
      signOutFn({refresh_token: user?.refresh_token})
    }else{
      localStorage.removeItem("user");
      window.location.href = "/";
    }
  };

  const openAuthDialog = () => {
    setShowAuthDialog(true);
  };

  const handleProtectedRoute = (e: React.MouseEvent, path: string) => {
    if (!user?.user?.id) {
      e.preventDefault();
      openAuthDialog();
    }else{
      navigate(path);
    }
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              AI TryOn
            </span>
          </Link>

          {/* Navigation Tabs */}
          <div className="hidden md:block">
            <Tabs value={currentPath} className="w-auto">
              <TabsList className="grid w-fit grid-cols-3 bg-muted/50 backdrop-blur">
                <TabsTrigger value="/" asChild >
                  <Link to="/" className="flex items-center space-x-2">
                    <Home className="h-4 w-4" />
                    <span>Home</span>
                  </Link>
                </TabsTrigger>
                <TabsTrigger value="/gallery" asChild onClick={(e) => handleProtectedRoute(e, "/gallery")}>
                  <Link to="/gallery" className="flex items-center space-x-2">
                    <Images className="h-4 w-4" />
                    <span>Gallery</span>
                  </Link>
                </TabsTrigger>
                <TabsTrigger value="/profile" asChild onClick={(e) => handleProtectedRoute(e, "/profile")}>
                  <Link to="/profile" className="flex items-center space-x-2"> 
                    <User className="h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Auth Section */}
          <div className="flex items-center space-x-4">
            {!user?.user?.id ? (
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={openAuthDialog}>
                  Sign In
                </Button>
                <Button variant="default" size="sm" onClick={openAuthDialog}>
                  Sign Up
                </Button>
              </div>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="/placeholders.svg" alt="User" />
                      <AvatarFallback className="bg-gradient-primary text-white text-lg font-semibold">
                        {user.user.full_name.split(" ").length > 1
                          ? user.user.full_name.split(" ")[0][0] + user.user.full_name.split(" ")[1][0]
                          : "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{user.user.full_name}</p>
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                          {user.user.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pb-4">
          <Tabs value={currentPath} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-muted/50 backdrop-blur">
              <TabsTrigger value="/" asChild>
                <Link to="/" className="flex items-center space-x-1">
                  <Home className="h-4 w-4" />
                  <span className="text-xs">Home</span>
                </Link>
              </TabsTrigger>
              <TabsTrigger value="/gallery" asChild onClick={(e) => handleProtectedRoute(e, "/gallery")}>
                <Link to="/gallery" className="flex items-center space-x-1">
                  <Images className="h-4 w-4" />
                  <span className="text-xs">Gallery</span>
                </Link>
              </TabsTrigger>
              <TabsTrigger value="/profile" asChild onClick={(e) => handleProtectedRoute(e, "/profile")}>
                <Link to="/profile" className="flex items-center space-x-1">
                  <User className="h-4 w-4" />
                  <span className="text-xs">Profile</span>
                </Link>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <AuthDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
      />
    </nav>
  );
};

export default Navigation;
