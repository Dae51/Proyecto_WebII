// Se importa el cliente de Supabase
import { supabase } from "./supabaseClient";
// Se importan las funciones de normalización de texto y correo electrónico
import { normalizeEmail, normalizeText } from "./validator";
import { normalizeRole, USER_ROLES } from "./roles";

// Función para construir un objeto de error de autenticación a partir de diferentes tipos de errores
function buildAuthError(error, fallbackMessage) {
  if (error && typeof error === "object" && "message" in error) {
    return error;
  }

  if (error instanceof Error) {
    return { message: error.message };
  }

  return { message: fallbackMessage };
}

// Función para obtener la sesión actual del usuario, manejando errores y devolviendo un objeto con la sesión o el error
export async function getCurrentSession() {
  try {
    const { data, error } = await supabase.auth.getSession();
    const session = enrichSessionWithRole(data?.session ?? null);
    return { session, error };
  } catch (error) {
    return {
      session: null,
      error: buildAuthError(error, "No se pudo obtener la sesión actual."),
    };
  }
}

// Función para suscribirse a los cambios de autenticación, devolviendo la suscripción creada por Supabase
export function subscribeToAuthChanges(callback) {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, enrichSessionWithRole(session));
  });
  return data?.subscription ?? null;
}

// Función para cerrar la sesión del usuario, manejando errores y devolviendo un objeto con el resultado de la operación
export async function loginWithPassword({ email, password }) {
  const normalizedEmail = normalizeEmail(email);
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    return {
      data: {
        ...data,
        session: enrichSessionWithRole(data?.session ?? null),
      },
      error,
    };
  } catch (error) {
    return {
      data: null,
      error: buildAuthError(error, "No se pudo iniciar sesión."),
    };
  }
}

// Función para registrar un nuevo usuario con correo electrónico y contraseña, 
export async function registerWithPassword({
  email,
  password,
  name,
  lastName,
  address,
  phone,
  dui,
  role = USER_ROLES.CLIENT,
  emailRedirectTo,
}) {
  const normalizedEmail = normalizeEmail(email);
  const firstName = normalizeText(name);
  const lastNameValue = normalizeText(lastName);
  const addressValue = normalizeText(address);
  const phoneValue = normalizeText(phone);
  const duiValue = normalizeText(dui);

  try {
    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          role: normalizeRole(role),
        },
        emailRedirectTo,
      },
    });

    if (data && data.user) {
      const { error: insertError } = await supabase.from('clientes').insert({
        uuid: data.user.id,
        name: firstName,
        last_name: lastNameValue,
        address: addressValue,
        phone: phoneValue,
        mail: normalizedEmail,
        DUI: duiValue
      });

      if (insertError) {
        console.error("Error al registrar el registro en tabla clientes:", insertError);
      }
    }

    return {
      data: {
        ...data,
        session: enrichSessionWithRole(data?.session ?? null),
      },
      error,
    };
  } catch (error) {
    return {
      data: null,
      error: buildAuthError(error, "No se pudo registrar la cuenta."),
    };
  }
}

// Función para solicitar la recuperación de contraseña, enviando un correo con un enlace de restablecimiento y manejando errores
export async function requestPasswordRecovery({ email, redirectTo }) {
  const normalizedEmail = normalizeEmail(email);
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo,
    });
    return { data, error };
  } catch (error) {
    return {
      data: null,
      error: buildAuthError(error, "No se pudo solicitar la recuperación de contraseña."),
    };
  }
}

// Función para actualizar la contraseña del usuario, manejando errores y devolviendo un objeto con el resultado de la operación
export async function updatePassword(password) {
  try {
    const { data, error } = await supabase.auth.updateUser({ password });
    return { data, error };
  } catch (error) {
    return {
      data: null,
      error: buildAuthError(error, "No se pudo actualizar la contraseña."),
    };
  }
}

export function getRoleFromUser(user) {
  return normalizeRole(user?.user_metadata?.role);
}

export function enrichSessionWithRole(session) {
  if (!session?.user) return session;

  const role = getRoleFromUser(session.user);
  return {
    ...session,
    user: {
      ...session.user,
      app_role: role,
    },
    app_role: role,
  };
}
