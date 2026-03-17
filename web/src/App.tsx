// App.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { TooltipProvider } from "./components/ui/tooltip";
import { Toaster } from "./components/ui/toaster"; // shadcn/ui

// Layouts & Pages
import Dashboard from "./pages/Dashboard";
import Classrooms from "./pages/Classrooms";
import AllAssignments from "./pages/AllAssignments";
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
import AllNotesPage from "./pages/AllNotesPage";
import ClassroomLivePage from "./pages/ClassroomLivePage";
import LiveClassPage from "./pages/LiveClassPage";
import AllMaterials from "./pages/AllMaterials";
import LiveClassesPage from "./pages/live/LiveClassesPage";
import { LiveSessionProvider } from "./components/live/LiveSessionContext";
import { MiniLiveOverlay } from "./components/live/MiniLiveOverlay";
import { useToast } from "./hooks/use-toast";
import { getPWAUpdateEventName, refreshPWA } from "./utils/pwa";

const queryClient = new QueryClient();

function ThemeProvider() {
  const { theme } = useThemeStore();

  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return null;
}

function AppContent() {
  const { toast } = useToast();

  React.useEffect(() => {
    const eventName = getPWAUpdateEventName();

    const handleUpdateAvailable = () => {
      toast({
        title: "New version available",
        description: "Refresh to update Classroom Hub.",
        action: (
          <button
            className="inline-flex h-8 items-center rounded-md border px-3 text-xs"
            onClick={() => {
              void refreshPWA();
            }}
          >
            Refresh
          </button>
        ),
      });
    };

    window.addEventListener(eventName, handleUpdateAvailable);
    return () => {
      window.removeEventListener(eventName, handleUpdateAvailable);
    };
  }, [toast]);

  return (
    <LiveSessionProvider>
      <Routes>
        {/* Protected App routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="classrooms" element={<Classrooms />} />
            <Route path="classrooms/:id" element={<Class />} />
            <Route path="allmaterials" element={<AllMaterials />}>
              <Route index element={<Navigate to="assignments" replace />} />
              <Route path="assignments" element={<AllAssignments />} />
              <Route path="notes" element={<AllNotesPage />} />
            </Route>
            <Route path="allassignments" element={<Navigate to="/allmaterials/assignments" replace />} />
            <Route path="notes" element={<Navigate to="/allmaterials/notes" replace />} />
            <Route path="settings" element={<Settings />} />
            <Route path="live" element={<LiveClassesPage />} />
            <Route path="live-class" element={<LiveClassPage />} />
            <Route path="classrooms/:classroomId/live" element={<ClassroomLivePage />} />
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
      <MiniLiveOverlay />
    </LiveSessionProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <ThemeProvider />
          <Toaster />
          {/* <Sonner /> */}
          <AppContent />
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
