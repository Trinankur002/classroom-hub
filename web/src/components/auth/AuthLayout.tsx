import { Outlet } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import authHeroBg from "@/assets/auth-hero-bg.jpg";

export function AuthLayout() {
  return (
    <div 
      className="min-h-screen bg-gradient-hero flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: `linear-gradient(135deg, hsl(213 94% 68% / 0.9) 0%, hsl(142 71% 45% / 0.9) 100%), url(${authHeroBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="w-full max-w-md">
        {/* Logo and Brand */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-card mb-4">
            <GraduationCap className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">ClassHub</h1>
          <p className="text-white/80">Your digital classroom platform</p>
        </div>

        {/* Auth Form */}
        <div className="bg-card rounded-2xl shadow-hover p-8 animate-scale-in">
          <Outlet />
        </div>
      </div>
    </div>
  );
}