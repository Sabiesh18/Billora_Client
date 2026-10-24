import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../api/client';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  isPostLoginLoading: boolean;
  dismissPostLoginLoader: () => void;
  login: (username: string, pass: string) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [isPostLoginLoading, setIsPostLoginLoading] = useState(false);

  useEffect(() => {
    const handleExpired = () => {
      setUser(null);
      setIsPostLoginLoading(false);
    };
    window.addEventListener('auth-expired', handleExpired);
    return () => window.removeEventListener('auth-expired', handleExpired);
  }, []);

  const login = async (username: string, pass: string): Promise<User> => {
    setLoading(true);
    try {
      const data = await authApi.login({ username, password: pass });
      const userObj: User = {
        userId: data.userId,
        username: data.username,
        fullName: data.fullName,
        role: data.role,
      };
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(userObj));
      setUser(userObj);
      // Trigger modern animation loader only on successful login
      setIsPostLoginLoading(true);
      return userObj;
    } finally {
      setLoading(false);
    }
  };

  const dismissPostLoginLoader = () => {
    setIsPostLoginLoading(false);
  };

  const logout = async (): Promise<void> => {
    try {
      await authApi.logout();
    } catch (e) {
      console.warn('Logout API cleanup exception:', e);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setIsPostLoginLoading(false);
    }
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isAdmin,
        loading,
        isPostLoginLoading,
        dismissPostLoginLoader,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
