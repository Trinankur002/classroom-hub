// components/auth/PublicRoute.tsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/AuthContext";

const PublicRoute = () => {
    const { isAuthenticated, isVerifying } = useAuth();

    if (isVerifying) {
        // Still verifying token → show loader
        return (
            <div className="flex items-center justify-center h-screen">
                <span className="text-lg font-medium">Loading...</span>
            </div>
        );
    }

    if (isAuthenticated) {
        // Already logged in → redirect to base route
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default PublicRoute;
