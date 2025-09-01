import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useToast } from "./use-toast";
import { useNavigate } from "react-router-dom";
import AuthService from '@/services/authservice';

interface AuthContextType {
  isLoading: boolean;
  isVerifying: boolean;
  isAuthenticated: boolean;
  user: any | null;
  login: (data: any) => Promise<void>;
  signup: (data: any) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setIsAuthenticated(false);
        setUser(null);
        setIsVerifying(false);
        return;
      }

      try {
        const userData = await AuthService.me();
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Token verification failed", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsVerifying(false);
      }
    };

    verifyToken();
  }, []);

  const login = async (data: any) => {
    setIsLoading(true);
    try {
      const { access_token } = await AuthService.login(data.email, data.password);
      localStorage.setItem("token", access_token);
      setIsAuthenticated(true);

      const userData = await AuthService.me();
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));

      toast({
        title: "Welcome back!",
        description: "Successfully signed in",
      });
      navigate("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (data: any) => {
    setIsLoading(true);
    try {
      const { access_token } = await AuthService.signup(data);
      localStorage.setItem("token", access_token);
      setIsAuthenticated(true);

      const userData = await AuthService.me();
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));

      toast({
        title: "Welcome!",
        description: "Account created. You're now signed in.",
      });
      navigate("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    toast({
      title: "Goodbye!",
      description: "You've been signed out.",
    });
    localStorage.removeItem("user");
    setUser(null);
    setIsAuthenticated(false);
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ login, signup, logout, isLoading, isVerifying, isAuthenticated, user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};