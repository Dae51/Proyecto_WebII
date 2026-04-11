/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getCurrentSession, subscribeToAuthChanges } from "../resources/AuthService";
import { getRoleLabel, isDashboardRole, userHasRole } from "../resources/roles";
import { supabase } from "../resources/supabaseClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [cliente, setCliente] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      const { session: currentSession } = await getCurrentSession();
      if (!mounted) return;
      setSession(currentSession);
      
      if (currentSession?.user) {
        const { data } = await supabase.from('clientes').select('*').eq('uuid', currentSession.user.id).single();
        if (mounted) setCliente(data || null);
      }
      
      setLoading(false);
    };

    bootstrap();

    const subscription = subscribeToAuthChanges(async (_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
      
      if (nextSession?.user) {
        const { data } = await supabase.from('clientes').select('*').eq('uuid', nextSession.user.id).single();
        if (mounted) setCliente(data || null);
      } else {
        if (mounted) setCliente(null);
      }
      
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
      cliente,
      loading,
      role,
      roleLabel: getRoleLabel(role),
      metadata,
      isAuthenticated: !!user,
      isDashboardUser: isDashboardRole(role),
      hasRole: (allowedRoles) => userHasRole(role, allowedRoles),
    };
  }, [loading, session, cliente]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider.");
  }

  return context;
}
