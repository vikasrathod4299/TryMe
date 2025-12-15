
import React from "react";
import ReactDOM from "react-dom/client";
import "./styles/global.css";

import { QueryProvider } from "./providers/QueryProvider";
import { RouterProvider } from "./router/RouterProvider";
import { AuthProvider } from "./context/AuthContext";
import MainLayout from "./layouts/MainLayout.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <QueryProvider>
    <AuthProvider>
      <RouterProvider>
        <MainLayout />
      </RouterProvider>
    </AuthProvider>
  </QueryProvider>
);

