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
      const selectedUser = localStorage.getItem('selectedUser');
      if (selectedUser) {
        const userData = JSON.parse(selectedUser);
        setUser(userData);
      } else {
        // Check if we're on a protected route and redirect to home if no user
        const currentPath = window.location.pathname;
        const protectedRoutes = ['/dashboard', '/ask', '/quiz', '/courses', '/enrollments',
                               '/my-assignments', '/my-grades', '/academic-records',
                               '/course-materials', '/discussions', '/student-assessments',
                               '/lecturer-course-management', '/lecturer-assessments',
                               '/my-courses', '/students', '/departments', '/programs',
                               '/user-management', '/assignments', '/course-management',
                               '/course-analytics', '/campus-coordination', '/profile',
                               '/settings', '/my-programs', '/course-details'];

        if (protectedRoutes.some(route => currentPath.startsWith(route))) {
          window.location.href = '/';
          return;
        }
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (_email: string, _password: string) => {
    throw new Error("Please select a role from the home page");
  };

  const register = async (_name: string, _email: string, _password: string) => {
    throw new Error("Please select a role from the home page");
  };

  const logout = async () => {
    try {
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
