import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { useIsMobile } from "@/hooks/use-mobile";

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {!isMobile && (
        <Sidebar
          open={sidebarOpen}
          onOpenChange={setSidebarOpen}
        />
      )}

      <main
        className={`transition-all duration-300 ease-smooth ${!isMobile ? (sidebarOpen ? "ml-64" : "ml-16") : "pb-16"}`}
      >
        <div className="animate-fade-in">
          <Outlet />
        </div>
      </main>

      {isMobile && <BottomNav />}
    </div>
  );
}