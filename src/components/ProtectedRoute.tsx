// ─── ProtectedRoute ───────────────────────────────────────────────────────────
// Redirects to /login if no valid session.
// Optionally restricts to a specific role.
// ──────────────────────────────────────────────────────────────────────────────

import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface Props {
  children:     React.ReactNode;
  requireRole?: "ADMIN" | "STAFF";
}

export default function ProtectedRoute({ children, requireRole }: Props) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // While restoring session from localStorage, show nothing (avoids flash)
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not authenticated — redirect to login, remember where they were
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role check — e.g. admin-only pages
  if (requireRole && user.role !== requireRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
