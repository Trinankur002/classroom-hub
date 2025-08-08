import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { 
  Home, 
  Users, 
  BookOpen, 
  MessageCircle, 
  Settings, 
  ChevronLeft,
  GraduationCap,
  Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const navigationItems = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Classrooms", href: "/classrooms", icon: Users },
  { name: "Projects", href: "/projects", icon: BookOpen },
  { name: "Chat", href: "/chat", icon: MessageCircle },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar({ open, onOpenChange }: SidebarProps) {
  const location = useLocation();

  return (
    <>
      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 z-50 h-full bg-card border-r border-border transition-all duration-300 ease-smooth flex flex-col",
        open ? "w-64" : "w-16"
      )}>
        {/* Header */}
        <div className={cn("border-b border-border", open ? "px-4 py-3" : "p-2")}>
          <div className={cn("flex items-center", open ? "justify-between" : "flex-col space-y-2")}>
            <GraduationCap className={cn("text-primary", open ? "h-8 w-8" : "h-10 w-10")} />
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(!open)}
              className={cn("h-8 w-8 p-0", !open && "mx-auto")}
            >
              {open ? <ChevronLeft className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
          
          {open && <div className="font-bold text-xl text-foreground mt-2">ClassHub</div>}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.href || 
                           (item.href !== "/dashboard" && location.pathname.startsWith(item.href));
            
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center rounded-lg p-3 transition-all duration-200 ease-smooth group",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  open ? "justify-start space-x-3" : "justify-center"
                )}
              >
                <item.icon className={cn(
                  "h-5 w-5 flex-shrink-0 transition-colors duration-200",
                  isActive ? "text-primary-foreground" : ""
                )} />
                <span className={cn(
                  "font-medium transition-opacity duration-200 overflow-hidden whitespace-nowrap",
                  open ? "opacity-100 w-auto" : "opacity-0 w-0"
                )}>
                  {item.name}
                </span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Profile (when expanded) */}
        {open && (
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-muted rounded-lg p-3 animate-fade-in">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center">
                  <span className="text-sm font-medium text-white">JD</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">John Doe</p>
                  <p className="text-xs text-muted-foreground truncate">Teacher</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}