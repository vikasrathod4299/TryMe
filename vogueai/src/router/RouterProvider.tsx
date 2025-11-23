
import { createContext, useContext, useState } from "react";

interface RouterContextProps {
  currentPath: string;
  navigate: (path: string) => void;
}

const RouterContext = createContext<RouterContextProps>({
  currentPath: "/",
  navigate: () => {},
});

export const RouterProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentPath, setCurrentPath] = useState("/");

  const navigate = (path: string) => {
    setCurrentPath(path);
    window.scrollTo(0, 0);
  };

  return (
    <RouterContext.Provider value={{ currentPath, navigate }}>
      {children}
    </RouterContext.Provider>
  );
};

export const useRouter = () => useContext(RouterContext);
