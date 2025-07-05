import {
  useState,
  useEffect,
  useContext,
  createContext,
  ReactNode,
} from "react";
import { User, AuthContextType } from "../types";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Check if there's a selected user in localStorage
      const selectedUser = localStorage.getItem('selectedUser');
      if (selectedUser) {
        const userData = JSON.parse(selectedUser);
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    // This function is kept for compatibility but won't be used
    // Users will select roles from the home page instead
    throw new Error("Please select a role from the home page");
  };

  const register = async (name: string, email: string, password: string) => {
    // This function is kept for compatibility but won't be used
    // Users will select roles from the home page instead
    throw new Error("Please select a role from the home page");
  };

  const logout = async () => {
    try {
      // Remove the selected user from localStorage
      localStorage.removeItem('selectedUser');
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
