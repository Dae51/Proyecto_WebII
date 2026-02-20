import { supabase } from "./supabaseClient";

function normalizeEmail(email) {
  return String(email ?? "").trim().toLowerCase();
}

function normalizeText(value) {
  return String(value ?? "").trim();
}

function buildAuthError(error, fallbackMessage) {
  if (error && typeof error === "object" && "message" in error) {
    return error;
  }

  if (error instanceof Error) {
    return { message: error.message };
  }

  return { message: fallbackMessage };
}

export function validateLoginInput({ email, password }) {
  if (!normalizeEmail(email) || !password) {
    return "Correo y contraseña son obligatorios.";
  }
  return null;
}

export function validateRegisterInput({
  email,
  password,
  confirmPassword,
  name,
  lastName,
}) {
  if (!normalizeEmail(email) || !password) {
    return "Correo y contraseña son obligatorios.";
  }
  if (!normalizeText(name) || !normalizeText(lastName)) {
    return "Nombre y apellido son obligatorios.";
  }
  if (password.length < 8) {
    return "La contraseña debe tener al menos 8 caracteres.";
  }
  if (password !== confirmPassword) {
    return "Las contraseñas no coinciden.";
  }
  return null;
}

export async function getCurrentSession() {
  try {
    const { data, error } = await supabase.auth.getSession();
    return { session: data?.session ?? null, error };
  } catch (error) {
    return {
      session: null,
      error: buildAuthError(error, "No se pudo obtener la sesión actual."),
    };
  }
}

export function subscribeToAuthChanges(callback) {
  const { data } = supabase.auth.onAuthStateChange(callback);
  return data?.subscription ?? null;
}

export async function loginWithPassword({ email, password }) {
  const normalizedEmail = normalizeEmail(email);
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    return { data, error };
  } catch (error) {
    return {
      data: null,
      error: buildAuthError(error, "No se pudo iniciar sesión."),
    };
  }
}

export async function registerWithPassword({
  email,
  password,
  name,
  lastName,
  emailRedirectTo,
}) {
  const normalizedEmail = normalizeEmail(email);
  const firstName = normalizeText(name);
  const lastNameValue = normalizeText(lastName);

  try {
    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastNameValue,
        },
        emailRedirectTo,
      },
    });

    return { data, error };
  } catch (error) {
    return {
      data: null,
      error: buildAuthError(error, "No se pudo registrar la cuenta."),
    };
  }
}
