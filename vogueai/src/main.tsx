
import React from "react";
import ReactDOM from "react-dom/client";
import "./styles/global.css";

import { RouterProvider } from "./router/RouterProvider";
import { AuthProvider } from "./context/AuthContext";
import MainLayout from "./layouts/MainLayout.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <RouterProvider>
      <MainLayout />
    </RouterProvider>
  </AuthProvider>
);

