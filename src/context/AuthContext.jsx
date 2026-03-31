import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getCurrentSession, subscribeToAuthChanges } from "../resources/AuthService";
import { getRoleLabel, isDashboardRole, userHasRole } from "../resources/roles";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      const { session: currentSession } = await getCurrentSession();
      if (!mounted) return;
      setSession(currentSession);
      setLoading(false);
    };

    bootstrap();

    const subscription = subscribeToAuthChanges((_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe?.();
    };
  }, []);

  const value = useMemo(() => {
    const user = session?.user ?? null;
    const role = session?.app_role ?? user?.app_role ?? "cliente";
    const metadata = user?.user_metadata ?? {};

    return {
      session,
      user,
      loading,
      role,
      roleLabel: getRoleLabel(role),
      metadata,
      isAuthenticated: !!user,
      isDashboardUser: isDashboardRole(role),
      hasRole: (allowedRoles) => userHasRole(role, allowedRoles),
    };
  }, [loading, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider.");
  }

  return context;
}
