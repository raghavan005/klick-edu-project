// ─── AuthContext ──────────────────────────────────────────────────────────────
// Global auth state: user, login, logout, role checks.
// Wrap the app with <AuthProvider> and consume with useAuth().
// ──────────────────────────────────────────────────────────────────────────────

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getStoredUser, setToken, clearAuth, isAuthenticated,
  type AuthUser,
} from "../lib/auth";

interface AuthContextValue {
  user:       AuthUser | null;
  isLoading:  boolean;
  login:      (email: string, password: string) => Promise<void>;
  logout:     () => void;
  isAdmin:    boolean;
  isStaff:    boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]           = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate                  = useNavigate();

  // Restore session from localStorage on mount
  useEffect(() => {
    if (isAuthenticated()) {
      setUser(getStoredUser());
    }
    setIsLoading(false);
  }, []);

  // Listen for 401 events fired by authFetch — handles session expiry cleanly
  useEffect(() => {
    const handler = () => {
      setUser(null);
      navigate("/login", { replace: true });
    };
    window.addEventListener("crm:unauthorized", handler);
    return () => window.removeEventListener("crm:unauthorized", handler);
  }, [navigate]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Login failed.");
      }

      setToken(data.token, data.user);
      setUser(data.user);
    } catch (error: any) {
      console.error("Login fetch error:", error);
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
    navigate("/login", { replace: true });
  }, [navigate]);

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      login,
      logout,
      isAdmin: user?.role === "ADMIN",
      isStaff: user?.role === "STAFF",
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
