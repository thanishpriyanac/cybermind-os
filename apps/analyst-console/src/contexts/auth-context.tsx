'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  email: string;
  tenantId: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, email: string, tenantId: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const storedToken = localStorage.getItem('token');
        const storedEmail = localStorage.getItem('email');
        const storedTenantId = localStorage.getItem('tenantId');

        if (storedToken && storedEmail && storedTenantId && storedToken !== 'demo-token') {
          setToken(storedToken);
          setUser({ email: storedEmail, tenantId: storedTenantId });
          // Ensure cookies stay in sync for Edge middleware
          document.cookie = `token=${storedToken}; path=/; max-age=86400; SameSite=Lax`;
          document.cookie = `user_email=${storedEmail}; path=/; max-age=86400; SameSite=Lax`;
        } else {
          // Clear lingering demo or invalid tokens
          localStorage.removeItem('token');
          localStorage.removeItem('email');
          localStorage.removeItem('tenantId');
          localStorage.removeItem('user_role');
          localStorage.removeItem('restricted_paths');
          setToken(null);
          setUser(null);
        }
      }
    } catch (e) {
      console.error('Auth context sync error:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (newToken: string, email: string, tenantId: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', newToken);
      localStorage.setItem('email', email);
      localStorage.setItem('tenantId', tenantId);

      const userRole = localStorage.getItem('user_role') || 'ADMIN';
      document.cookie = `token=${newToken}; path=/; max-age=86400; SameSite=Lax`;
      document.cookie = `user_email=${email}; path=/; max-age=86400; SameSite=Lax`;
      document.cookie = `user_role=${userRole}; path=/; max-age=86400; SameSite=Lax`;
    }
    setToken(newToken);
    setUser({ email, tenantId });
    router.push('/dashboard');
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('email');
      localStorage.removeItem('tenantId');
      localStorage.removeItem('user_role');
      localStorage.removeItem('restricted_paths');
      document.cookie = 'token=; path=/; max-age=0;';
      document.cookie = 'user_email=; path=/; max-age=0;';
      document.cookie = 'user_role=; path=/; max-age=0;';
    }
    setToken(null);
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

