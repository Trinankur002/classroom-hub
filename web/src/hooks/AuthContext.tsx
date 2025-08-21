import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useToast } from "./use-toast";
import { useNavigate } from "react-router-dom";

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
        const response = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem("token");
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        localStorage.removeItem("token");
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
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to login");
      }

      const { access_token } = await response.json();
      localStorage.setItem("token", access_token);
      setIsAuthenticated(true);

      // Fetch user data after login
      const userResponse = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUser(userData);
      } else {
        setUser(null);
      }

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
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to sign up");
      }

      const { access_token } = await response.json();
      if (!access_token) {
        throw new Error("Signup did not return an access token");
      }

      localStorage.setItem("token", access_token);
      setIsAuthenticated(true);

      // Fetch user data after signup
      const userResponse = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUser(userData);
      } else {
        setUser(null);
      }

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
