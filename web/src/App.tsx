// App.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { TooltipProvider } from "./components/ui/tooltip";
import { Toaster } from "./components/ui/toaster"; // shadcn/ui

// Layouts & Pages
import Dashboard from "./pages/Dashboard";
import Classrooms from "./pages/Classrooms";
import Projects from "./pages/Projects";
import Chat from "./pages/Chat";
import Settings from "./pages/Settings";

import NotFound from "./pages/NotFound";
import React from "react";
import { AuthLayout } from "./components/auth/AuthLayout";
import { Login } from "./components/auth/Login";
import { SignUp } from "./components/auth/SignUp";
import { AppLayout } from "./components/layout/AppLayout";
import { AuthProvider } from "./hooks/AuthContext";
import { useThemeStore } from "./lib/store";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import PublicRoute from "./components/auth/PublicRoute";
import Class from "./pages/Class";

const queryClient = new QueryClient();

function ThemeProvider() {
  const { theme } = useThemeStore();

  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <ThemeProvider />
          <Toaster />
          {/* <Sonner /> */}

          <Routes>
            {/* Protected App routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<AppLayout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="classrooms" element={<Classrooms />} />
                <Route path="classrooms/:id" element={<Class />} />
                <Route path="allassignments" element={<Projects />} />
                <Route path="chat" element={<Chat />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Route>

            {/* Public (auth) routes */}
            <Route element={<PublicRoute />}>
              <Route element={<AuthLayout />}>
                <Route path="login" element={<Login />} />
                <Route path="signup" element={<SignUp />} />
              </Route>
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>


        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
