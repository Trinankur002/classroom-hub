import { NavLink, useLocation } from "react-router-dom";
import { Home, Users, MessageCircle, Settings, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const bottomNavItems = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Classes", href: "/classrooms", icon: Users },
  { name: "All Assignments", href: "/allassignments", icon: BookOpen },
  { name: "Chat", href: "/chat", icon: MessageCircle },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
      <div className="flex items-center justify-around py-2">
        {bottomNavItems.map((item) => {
          const isActive = location.pathname === item.href || 
                         (item.href !== "/dashboard" && location.pathname.startsWith(item.href));
          
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all duration-200 ease-smooth min-w-0 flex-1",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className={cn(
                "h-5 w-5 mb-1 transition-colors duration-200",
                isActive ? "text-primary" : ""
              )} />
              <span className={cn(
                "text-xs font-medium truncate",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
                {item.name}
              </span>
              {isActive && (
                <div className="absolute -top-0.5 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}