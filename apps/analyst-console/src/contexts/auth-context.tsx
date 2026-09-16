'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../lib/api';

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

const DEFAULT_USER: User = {
  email: 'admin@cybermind.local',
  tenantId: 'cybermind-master-tenant',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(DEFAULT_USER);
  const [token, setToken] = useState<string | null>('demo-token');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const storedToken = localStorage.getItem('token');
        const storedEmail = localStorage.getItem('email');
        const storedTenantId = localStorage.getItem('tenantId');

        if (storedToken && storedEmail && storedTenantId) {
          setToken(storedToken);
          setUser({ email: storedEmail, tenantId: storedTenantId });
        } else {
          localStorage.setItem('email', DEFAULT_USER.email);
          localStorage.setItem('tenantId', DEFAULT_USER.tenantId);
          localStorage.setItem('token', 'demo-token');
          localStorage.setItem('user_role', 'ADMIN');
        }
      }
    } catch (e) {
      console.error('Auth context sync error:', e);
    }
  }, []);

  const login = (newToken: string, email: string, tenantId: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', newToken);
      localStorage.setItem('email', email);
      localStorage.setItem('tenantId', tenantId);
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
