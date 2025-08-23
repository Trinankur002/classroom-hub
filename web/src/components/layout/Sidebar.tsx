import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  Home,
  Users,
  BookOpen,
  MessageCircle,
  Settings,
  ChevronLeft,
  GraduationCap,
  Menu,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

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
  const { logout, user } = useAuth();


  return (
    <>
      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 z-50 h-full bg-card border-r border-border transition-all duration-300 ease-smooth flex flex-col",
        open ? "w-64" : "w-16"
      )}>
        {/* Header */}
        <div className={cn("border-b border-border", open ? "px-4 py-3" : "p-2")}>
          <div className={cn("flex items-center", open ? "justify-between" : "flex-col")}>

            <Link to="/">
              <GraduationCap className={cn("text-primary transition-all", open ? "h-8 w-8" : "h-10 w-10")} />
            </Link>
            <Link to="/">
              {open && (<div className="font-bold text-xl text-foreground ml-2">ClassHub</div>)}
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(!open)}
              className={cn(
                "h-8 w-8 p-0 transition-all",
                open ? "ml-auto" : "mt-2"
              )}
            >
              {open ? (<ChevronLeft className="h-4 w-4" />) : (<ChevronRight className="h-4 w-4" />)}
            </Button>
          </div>
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
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  open ? "justify-start space-x-3" : "justify-center"
                )}
              >
                <item.icon className={cn(
                  "h-5 w-5 shrink-0 transition-colors duration-200",
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
        {user && (
          <div className="absolute bottom-4 left-4 right-4">
            {open ? (
              // 👉 Open State (Full Card)
              <div className="bg-muted rounded-lg p-3 animate-fade-in">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center transition-all duration-200 group-hover:ring-2 group-hover:ring-primary group-hover:scale-105 animate-fade-in cursor-pointer group"
                    onClick={() => {
                      console.log("Profile clicked");
                      //TODO: Profile click handle
                    }}
                  >
                    <span className="text-sm font-medium text-white ">
                      {user.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.role}</p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={logout}
                    className="ml-2 px-2 py-1 text-sm bg-red-700 text-white hover:bg-red-500 cursor-pointer transition-colors duration-200"
                  >
                    Logout
                  </Button>
                </div>
              </div>
            ) : (
              // 👉 Closed State (Compact)
              <div
                className="flex flex-col items-center space-y-2 animate-fade-in cursor-pointer group"
                onClick={() => onOpenChange(true)}
              >
                <div
                  className=" h-10 w-10 rounded-full bg-gradient-primary  flex items-center justify-center transition-all duration-200 group-hover:ring-2 group-hover:ring-primary group-hover:scale-105"
                >
                  <span className="text-sm font-medium text-white">
                    {user.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </>
  );
}
