import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient.js";

const DUI_PATTERN = /^\d{8}-\d$/;
const PHONE_PATTERN = /^\d{8}$/;
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
  return normalizeText(value).replace(/\D/g, "").slice(0, 8);
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

async function getAuthenticatedEmpresa() {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    throw new Error(getErrorMessage(authError, "Unable to get the authenticated user."));
  }

  if (!user) {
    throw new Error("You must be signed in to manage employees.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("empresa")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error(getErrorMessage(profileError, "Unable to resolve the authenticated company."));
  }

  if (!profile?.empresa) {
    throw new Error("The authenticated profile does not have an associated company.");
  }

  return {
    user,
    empresa: profile.empresa,
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
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshEmpleados = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const { empresa } = await getAuthenticatedEmpresa();
      const { data, error: empleadosError } = await supabase
        .from("empleados")
        .select("id, uuid, created_at, name, last_name, DUI, phone, email, address, empresa")
        .eq("empresa", empresa)
        .order("created_at", { ascending: false });

      if (empleadosError) {
        throw new Error(getErrorMessage(empleadosError, "Unable to load employees."));
      }

      setEmpleados(data ?? []);
      return { data: data ?? [], error: null };
    } catch (refreshError) {
      const message = getErrorMessage(refreshError, "Unable to load employees.");
      setEmpleados([]);
      setError(message);
      return { data: [], error: new Error(message) };
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshEmpleados();
  }, [refreshEmpleados]);

  const createEmpleado = useCallback(async (values) => {
    setError("");

    try {
      const validationMessage = validateEmpleadoInput(values);
      if (validationMessage) {
        throw new Error(validationMessage);
      }

      const { empresa } = await getAuthenticatedEmpresa();
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
        .single();

      if (insertError) {
        throw new Error(getErrorMessage(insertError, "Unable to create employee."));
      }

      await refreshEmpleados();
      return { data, error: null };
    } catch (createError) {
      const message = getErrorMessage(createError, "Unable to create employee.");
      setError(message);
      return { data: null, error: new Error(message) };
    }
  }, [refreshEmpleados]);

  const updateEmpleado = useCallback(async (empleadoId, values) => {
    setError("");

    try {
      const validationMessage = validateEmpleadoInput(values);
      if (validationMessage) {
        throw new Error(validationMessage);
      }

      const { empresa } = await getAuthenticatedEmpresa();
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
        .single();

      if (updateError) {
        throw new Error(getErrorMessage(updateError, "Unable to update employee."));
      }

      await refreshEmpleados();
      return { data, error: null };
    } catch (saveError) {
      const message = getErrorMessage(saveError, "Unable to update employee.");
      setError(message);
      return { data: null, error: new Error(message) };
    }
  }, [refreshEmpleados]);

  const deleteEmpleado = useCallback(async (empleadoId) => {
    setError("");

    try {
      const { empresa } = await getAuthenticatedEmpresa();
      await ensureEmpleadoOwnership(empleadoId, empresa);

      const { error: deleteError } = await supabase
        .from("empleados")
        .delete()
        .eq("id", empleadoId)
        .eq("empresa", empresa);

      if (deleteError) {
        throw new Error(getErrorMessage(deleteError, "Unable to delete employee."));
      }

      await refreshEmpleados();
      return { error: null };
    } catch (removeError) {
      const message = getErrorMessage(removeError, "Unable to delete employee.");
      setError(message);
      return { error: new Error(message) };
    }
  }, [refreshEmpleados]);

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
