import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useActor } from './useActor';
import { toast } from 'sonner';

interface AdminAuthContextType {
  isAdminAuthenticated: boolean;
  isLoggingIn: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

const ADMIN_AUTH_KEY = 'vocabchain_admin_authenticated';

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    // Check localStorage on mount
    return localStorage.getItem(ADMIN_AUTH_KEY) === 'true';
  });
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { actor } = useActor();

  // Persist auth state to localStorage
  useEffect(() => {
    if (isAdminAuthenticated) {
      localStorage.setItem(ADMIN_AUTH_KEY, 'true');
    } else {
      localStorage.removeItem(ADMIN_AUTH_KEY);
    }
  }, [isAdminAuthenticated]);

  const login = async (username: string, password: string): Promise<boolean> => {
    if (!actor) {
      toast.error('Backend not available. Please try again.');
      return false;
    }

    setIsLoggingIn(true);
    try {
      const result = await actor.adminLogin(username, password);
      if (result) {
        setIsAdminAuthenticated(true);
        toast.success('Admin login successful!');
        return true;
      } else {
        toast.error('Invalid username or password');
        return false;
      }
    } catch (error: any) {
      console.error('Admin login error:', error);
      // Check if error message contains "Invalid username or password"
      if (error.message && error.message.includes('Invalid username or password')) {
        toast.error('Invalid username or password');
      } else {
        toast.error('Login failed. Please try again.');
      }
      return false;
    } finally {
      setIsLoggingIn(false);
    }
  };

  const logout = () => {
    setIsAdminAuthenticated(false);
    toast.success('Logged out successfully');
  };

  return (
    <AdminAuthContext.Provider value={{ isAdminAuthenticated, isLoggingIn, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
