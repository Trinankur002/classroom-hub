import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export const ProtectedRoute = () => {
  const { isAuthenticated, isVerifying } = useAuth();

  if (isVerifying) {
    return null; // Or a loading spinner
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
};
