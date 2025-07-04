import {
  useState,
  useEffect,
  useContext,
  createContext,
  ReactNode,
} from "react";
import { User, AuthContextType } from "../types";
import { apiClient } from "../api/client";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const userData = await apiClient.getCurrentUser();
      setUser((userData as any).user);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.login(email, password);
      if (!(response as any) || !(response as any).user) {
        throw new Error("Login failed: Invalid credentials or server error.");
      }
      setUser((response as any).user);
    } catch (error) {
      setUser(null);
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await apiClient.register(name, email, password);
      if (!(response as any) || !(response as any).user) {
        throw new Error("Registration failed: Invalid data or server error.");
      }
      setUser((response as any).user);
    } catch (error) {
      setUser(null);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiClient.logout();
      setUser(null);
    } catch (error) {
      setUser(null);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
