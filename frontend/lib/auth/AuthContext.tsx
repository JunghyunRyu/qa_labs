"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import type { User, AuthStatus } from "@/types/auth";
import { getAuthStatus, logout as apiLogout, refreshToken } from "@/lib/api/auth";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshAuth = useCallback(async () => {
    try {
      const status = await getAuthStatus();
      setUser(status.user);
    } catch (error) {
      setUser(null);
    }
  }, []);

  const login = useCallback(() => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "/api";
    window.location.href = `${apiBaseUrl}/v1/auth/github/login`;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } finally {
      setUser(null);
    }
  }, []);

  // Check auth status on mount
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      try {
        const status = await getAuthStatus();
        setUser(status.user);
      } catch (error) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  // Set up token refresh interval
  useEffect(() => {
    if (!user) return;

    // Refresh token every 50 minutes (before 60 min expiry)
    const interval = setInterval(async () => {
      try {
        await refreshToken();
        await refreshAuth();
      } catch (error) {
        setUser(null);
      }
    }, 50 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user, refreshAuth]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
