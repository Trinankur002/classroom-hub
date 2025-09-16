import { useIsMobile } from "@/hooks/use-mobile";
import { Outlet } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { Sidebar } from "./Sidebar";
import { useAuth } from "@/hooks/AuthContext";
import { useState } from "react";

export function AppLayout() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (!user) {
    return <p>Loading...</p>; // or redirect to login
  }

  const userRole = user.role.toString().toLowerCase();

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {!isMobile && (
        <Sidebar
          open={sidebarOpen}
          onOpenChange={setSidebarOpen}
          user={user}
          userRole={userRole}
        />
      )}

      <main
        className={`transition-all duration-300 ease-smooth ${!isMobile ? (sidebarOpen ? "ml-64" : "ml-16") : "pb-16"
          }`}
      >
        <div className="animate-fade-in">
          <Outlet />
        </div>
      </main>

      {isMobile && <BottomNav userRole={userRole} />}
    </div>
  );
}
