// ProtectedRoute.tsx
import { useAuth } from "@/hooks/AuthContext";
import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = () => {
  const { isAuthenticated, isVerifying } = useAuth();

  if (isVerifying) {
    // show global loader while verifying
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="text-lg font-medium">Checking authentication...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;

