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
import { getAuthStatus, logout as apiLogout, refreshToken, acceptTerms as apiAcceptTerms } from "@/lib/api/auth";

type OAuthProvider = "github" | "google";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (provider?: OAuthProvider) => void;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  acceptTerms: () => Promise<void>;
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

  const login = useCallback((provider: OAuthProvider = "github") => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "/api";
    window.location.href = `${apiBaseUrl}/v1/auth/${provider}/login`;
  }, []);

  const acceptTerms = useCallback(async () => {
    await apiAcceptTerms();
    await refreshAuth();
  }, [refreshAuth]);

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
        acceptTerms,
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
