import { supabase } from "./supabaseClient";
import { normalizeRole, USER_ROLES } from "./roles";

function buildServiceError(error, fallbackMessage, status = 500) {
  return {
    status,
    message: error?.message || fallbackMessage,
    details: error ?? null,
  };
}

function normalizeEmpresaText(value) {
  return String(value ?? "").trim();
}

function toEmpresaPayload(values) {
  return {
    name: normalizeEmpresaText(values?.name),
    code: normalizeEmpresaText(values?.code).toUpperCase(),
    address: normalizeEmpresaText(values?.address),
    contact_name: normalizeEmpresaText(values?.contact_name),
    phone: normalizeEmpresaText(values?.phone),
    mail: normalizeEmpresaText(values?.mail).toLowerCase(),
    category: normalizeEmpresaText(values?.category),
  };
}

async function getCompanyAdminContext() {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        error: buildServiceError(authError, "Debes iniciar sesión para gestionar tu empresa.", 401),
      };
    }

    const rawRole = user?.app_metadata?.role || user?.user_metadata?.role;
    const role = normalizeRole(rawRole);

    if (role !== USER_ROLES.COMPANY_ADMIN) {
      return {
        error: buildServiceError(null, "Este módulo es exclusivo para administradores de empresa.", 403),
      };
    }

    const { data: empleado, error: empleadoError } = await supabase
      .from("empleados")
      .select("uuid, empresa")
      .eq("uuid", user.id)
      .maybeSingle();

    if (empleadoError) {
      return {
        error: buildServiceError(
          empleadoError,
          "No se pudo verificar la empresa vinculada a tu cuenta."
        ),
      };
    }

    if (!empleado) {
      return {
        error: buildServiceError(
          null,
          "Tu usuario no tiene un perfil de empleado asociado. Contacta a un administrador.",
          403
        ),
      };
    }

    return {
      user,
      empresaId: empleado.empresa ?? null,
      error: null,
    };
  } catch (error) {
    return {
      error: buildServiceError(error, "No se pudo validar tu contexto de empresa."),
    };
  }
}

export async function fetchEmpresas() {
  const { data, error } = await supabase
    .from('empresas')
    .select('*')
    .order('created_at', { ascending: false });
  return { data, error };
}

// Phone validator: we rely on UI regex or format ####-####
export async function createEmpresa(payload) {
  const { data, error } = await supabase
    .from('empresas')
    .insert(toEmpresaPayload(payload))
    .select()
    .single();
  return { data, error };
}

export async function updateEmpresa(id, payload) {
  const { data, error } = await supabase
    .from('empresas')
    .update(toEmpresaPayload(payload))
    .eq('id', id)
    .select()
    .single();
  return { data, error };
}

export async function deleteEmpresa(id) {
  const { data, error } = await supabase
    .from('empresas')
    .delete()
    .eq('id', id);
  return { data, error };
}

// Generate code AAA000 (3 uppercase letters + 3 digits)
const generateRandomCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const nums = "0123456789";
  let result = "";
  for (let i = 0; i < 3; i += 1) result += chars.charAt(Math.floor(Math.random() * chars.length));
  for (let i = 0; i < 3; i += 1) result += nums.charAt(Math.floor(Math.random() * nums.length));
  return result;
};

// Auto generate and verify against DB recursively
export async function generateUniqueEmpresaCode() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const code = generateRandomCode();
    const { data, error } = await supabase
      .from("empresas")
      .select("id")
      .eq("code", code)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) return code;
  }

  throw new Error("No fue posible generar un código único para la empresa.");
}

export async function fetchManagedEmpresa() {
  const context = await getCompanyAdminContext();

  if (context.error) {
    return { data: null, error: context.error, canCreate: false };
  }

  if (!context.empresaId) {
    return { data: null, error: null, canCreate: true };
  }

  const { data, error } = await supabase
    .from("empresas")
    .select("*")
    .eq("id", context.empresaId)
    .maybeSingle();

  if (error) {
    return {
      data: null,
      error: buildServiceError(error, "No se pudo cargar la empresa vinculada a tu cuenta."),
      canCreate: false,
    };
  }

  if (!data) {
    return {
      data: null,
      error: buildServiceError(
        null,
        "Tu cuenta apunta a una empresa inexistente. Contacta a un administrador.",
        404
      ),
      canCreate: false,
    };
  }

  return { data, error: null, canCreate: false };
}

export async function saveManagedEmpresa(values) {
  const context = await getCompanyAdminContext();

  if (context.error) {
    return { data: null, error: context.error, mode: null };
  }

  const payload = toEmpresaPayload(values);

  try {
    if (context.empresaId) {
      const { data, error } = await supabase
        .from("empresas")
        .update(payload)
        .eq("id", context.empresaId)
        .select()
        .single();

      return {
        data: data ?? null,
        error: error
          ? buildServiceError(error, "No se pudo actualizar la información de tu empresa.")
          : null,
        mode: "update",
      };
    }

    const code = payload.code || (await generateUniqueEmpresaCode());
    const { data, error } = await supabase
      .from("empresas")
      .insert({ ...payload, code })
      .select()
      .single();

    if (error || !data) {
      return {
        data: null,
        error: buildServiceError(error, "No se pudo registrar tu empresa."),
        mode: "create",
      };
    }

    const { error: employeeUpdateError } = await supabase
      .from("empleados")
      .update({ empresa: data.id })
      .eq("uuid", context.user.id);

    if (employeeUpdateError) {
      await supabase.from("empresas").delete().eq("id", data.id);

      return {
        data: null,
        error: buildServiceError(
          employeeUpdateError,
          "Se creó la empresa, pero no se pudo vincular a tu cuenta. Se revirtió el registro."
        ),
        mode: "create",
      };
    }

    return { data, error: null, mode: "create" };
  } catch (error) {
    return {
      data: null,
      error: buildServiceError(error, "No se pudo guardar tu empresa."),
      mode: context.empresaId ? "update" : "create",
    };
  }
}
