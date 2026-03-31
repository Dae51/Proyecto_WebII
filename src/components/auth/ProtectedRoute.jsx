import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function ProtectedRoute({
  children,
  allowedRoles = [],
  redirectTo = "/auth",
  fallbackPath = "/",
}) {
  const location = useLocation();
  const { isAuthenticated, hasRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-72px)] flex items-center justify-center bg-slate-950 text-white">
        Verificando acceso...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  if (allowedRoles.length > 0 && !hasRole(allowedRoles)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
}
