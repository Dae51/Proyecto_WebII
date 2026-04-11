import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient.js";
import { useAuth } from "../src/context/AuthContext.jsx";

const DUI_PATTERN = /^\d{8}-\d$/;
const PHONE_PATTERN = /^\d{4}-\d{4}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getErrorMessage(error, fallbackMessage) {
  if (error && typeof error === "object" && "message" in error) {
    return error.message || fallbackMessage;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallbackMessage;
}

function normalizeText(value) {
  return String(value ?? "").trim();
}

function normalizeDui(value) {
  const digits = normalizeText(value).replace(/\D/g, "").slice(0, 9);
  if (digits.length <= 8) return digits;
  return `${digits.slice(0, 8)}-${digits.slice(8, 9)}`;
}

function normalizePhone(value) {
  const digits = normalizeText(value).replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 4) return digits;
  return `${digits.slice(0, 4)}-${digits.slice(4)}`;
}

function normalizeEmpleadoInput(values) {
  return {
    name: normalizeText(values?.name),
    last_name: normalizeText(values?.last_name),
    DUI: normalizeDui(values?.DUI),
    phone: normalizePhone(values?.phone),
    email: normalizeText(values?.email).toLowerCase(),
    address: normalizeText(values?.address),
  };
}

function validateEmpleadoInput(values) {
  const empleado = normalizeEmpleadoInput(values);

  if (empleado.name.length < 2) {
    return "Name must have at least 2 characters.";
  }

  if (empleado.last_name.length < 2) {
    return "Last name must have at least 2 characters.";
  }

  if (!DUI_PATTERN.test(empleado.DUI)) {
    return "DUI must use the format ########-#.";
  }

  if (!PHONE_PATTERN.test(empleado.phone)) {
    return "Phone must contain exactly 8 digits.";
  }

  if (!EMAIL_PATTERN.test(empleado.email)) {
    return "Email must be valid.";
  }

  if (empleado.address.length > 255) {
    return "Address must be 255 characters or fewer.";
  }

  return null;
}

async function getAuthenticatedEmpresa(user) {
  if (!user?.id) {
    throw new Error("Debes iniciar sesión para administrar empleados.");
  }

  const { data: empleadosUsuario, error: empleadoError } = await supabase
    .from("empleados")
    .select("id, uuid, empresa, created_at")
    .eq("uuid", user.id)
    .order("created_at", { ascending: false });

  if (empleadoError) {
    throw new Error(getErrorMessage(empleadoError, "No se pudo resolver la empresa del usuario autenticado."));
  }

  const empleadoActual = Array.isArray(empleadosUsuario) ? empleadosUsuario[0] : null;

  if (!empleadoActual?.empresa) {
    throw new Error("Tu usuario autenticado no tiene una empresa asociada en la tabla empleados.");
  }

  return {
    empresa: empleadoActual.empresa,
    empleadoActual,
  };
}

async function ensureEmpleadoOwnership(empleadoId, empresa) {
  const { data, error } = await supabase
    .from("empleados")
    .select("id, empresa")
    .eq("id", empleadoId)
    .maybeSingle();

  if (error) {
    throw new Error(getErrorMessage(error, "Unable to validate employee ownership."));
  }

  if (!data || String(data.empresa) !== String(empresa)) {
    throw new Error("You cannot access employees from another company.");
  }

  return data;
}

export default function useEmpleados() {
  const { user, loading: authLoading } = useAuth();
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const resolveEmpresaUsuario = useCallback(async () => {
    if (authLoading) {
      throw new Error("Cargando sesión...");
    }

    return getAuthenticatedEmpresa(user);
  }, [authLoading, user]);

  const refreshEmpleados = useCallback(async () => {
    if (authLoading) return { data: [], error: null };

    setLoading(true);
    setError("");

    try {
      const { empresa } = await resolveEmpresaUsuario();
      const { data, error: empleadosError } = await supabase
        .from("empleados")
        .select("id, uuid, created_at, name, last_name, DUI, phone, email, address, empresa")
        .eq("empresa", empresa)
        .order("created_at", { ascending: false });

      if (empleadosError) {
        throw new Error(getErrorMessage(empleadosError, "No se pudieron cargar los empleados."));
      }

      setEmpleados(data ?? []);
      return { data: data ?? [], error: null };
    } catch (refreshError) {
      const message = getErrorMessage(refreshError, "No se pudieron cargar los empleados.");
      setEmpleados([]);
      setError(message);
      return { data: [], error: new Error(message) };
    } finally {
      setLoading(false);
    }
  }, [authLoading, resolveEmpresaUsuario]);

  useEffect(() => {
    if (authLoading) return;
    refreshEmpleados();
  }, [authLoading, refreshEmpleados]);

  const createEmpleado = useCallback(async (values) => {
    setError("");

    try {
      const validationMessage = validateEmpleadoInput(values);
      if (validationMessage) {
        throw new Error(validationMessage);
      }

      const { empresa } = await resolveEmpresaUsuario();
      const normalized = normalizeEmpleadoInput(values);

      const payload = {
        ...normalized,
        address: normalized.address || null,
        empresa,
      };

      const { data, error: insertError } = await supabase
        .from("empleados")
        .insert(payload)
        .select("id, uuid, created_at, name, last_name, DUI, phone, email, address, empresa")
        .maybeSingle();

      if (insertError || !data) {
        throw new Error(getErrorMessage(insertError, "No se pudo crear el empleado."));
      }

      await refreshEmpleados();
      return { data, error: null };
    } catch (createError) {
      const message = getErrorMessage(createError, "No se pudo crear el empleado.");
      setError(message);
      return { data: null, error: new Error(message) };
    }
  }, [refreshEmpleados, resolveEmpresaUsuario]);

  const updateEmpleado = useCallback(async (empleadoId, values) => {
    setError("");

    try {
      const validationMessage = validateEmpleadoInput(values);
      if (validationMessage) {
        throw new Error(validationMessage);
      }

      const { empresa } = await resolveEmpresaUsuario();
      await ensureEmpleadoOwnership(empleadoId, empresa);

      const normalized = normalizeEmpleadoInput(values);
      const payload = {
        ...normalized,
        address: normalized.address || null,
        empresa,
      };

      const { data, error: updateError } = await supabase
        .from("empleados")
        .update(payload)
        .eq("id", empleadoId)
        .eq("empresa", empresa)
        .select("id, uuid, created_at, name, last_name, DUI, phone, email, address, empresa")
        .maybeSingle();

      if (updateError || !data) {
        throw new Error(getErrorMessage(updateError, "No se pudo actualizar el empleado."));
      }

      await refreshEmpleados();
      return { data, error: null };
    } catch (saveError) {
      const message = getErrorMessage(saveError, "No se pudo actualizar el empleado.");
      setError(message);
      return { data: null, error: new Error(message) };
    }
  }, [refreshEmpleados, resolveEmpresaUsuario]);

  const deleteEmpleado = useCallback(async (empleadoId) => {
    setError("");

    try {
      const { empresa } = await resolveEmpresaUsuario();
      await ensureEmpleadoOwnership(empleadoId, empresa);

      const { error: deleteError } = await supabase
        .from("empleados")
        .delete()
        .eq("id", empleadoId)
        .eq("empresa", empresa);

      if (deleteError) {
        throw new Error(getErrorMessage(deleteError, "No se pudo eliminar el empleado."));
      }

      await refreshEmpleados();
      return { error: null };
    } catch (removeError) {
      const message = getErrorMessage(removeError, "No se pudo eliminar el empleado.");
      setError(message);
      return { error: new Error(message) };
    }
  }, [refreshEmpleados, resolveEmpresaUsuario]);

  return {
    empleados,
    loading,
    error,
    createEmpleado,
    updateEmpleado,
    deleteEmpleado,
    refreshEmpleados,
  };
}
