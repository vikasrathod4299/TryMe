
import { createContext, useContext, useState } from "react";

const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState(null);
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);

  const login = () => setUser({ name: "Demo User", email: "demo@vogueai.com" });
  const logout = () => setUser(null);

  return (
    <AuthContext.Provider
      value={{ user, login, logout, isAuthModalOpen, setAuthModalOpen }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

