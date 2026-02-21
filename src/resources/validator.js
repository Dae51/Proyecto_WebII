// Función para normalizar el correo electrónico, eliminando espacios y convirtiendo a minúsculas
export function normalizeEmail(email) {
  return String(email ?? "").trim().toLowerCase();
}

// Función para normalizar texto, eliminando espacios
export function normalizeText(value) {
  return String(value ?? "").trim();
}

// Función para verificar si un valor es vacío después de normalizarlo
export function isEmptyValue(value) {
  return normalizeText(value).length === 0;
}

// Función para validar los campos de entrada del formulario de inicio de sesión
export function validateLoginInput({ email, password }) {
  if (!normalizeEmail(email) || !password) {
    return "Correo y contraseña son obligatorios.";
  }
  return null;
}

// Función para validar los campos de entrada del formulario de registro
export function validateRegisterInput({
  email,
  password,
  confirmPassword,
  name,
  lastName,
  address,
  phone,
  dui,
}) {
  if (!normalizeEmail(email) || !password) {
    return "Correo y contraseña son obligatorios.";
  }
  if (isEmptyValue(name) || isEmptyValue(lastName) || isEmptyValue(address)) {
    return "Nombre, apellido y dirección son obligatorios.";
  }
  if (!/^\d{4}-\d{4}$/.test(String(phone ?? "").trim())) {
    return "El teléfono debe tener formato ####-####.";
  }
  if (!/^\d{8}-\d$/.test(String(dui ?? "").trim())) {
    return "El DUI debe tener formato ########-#.";
  }
  if (password.length < 8) {
    return "La contraseña debe tener al menos 8 caracteres.";
  }
  if (password !== confirmPassword) {
    return "Las contraseñas no coinciden.";
  }
  return null;
}

// Función para validar el campo de correo electrónico en el formulario de recuperación de contraseña
export function validateRecoveryEmailInput(email) {
  if (!normalizeEmail(email)) {
    return "El correo electrónico es obligatorio.";
  }
  return null;
}

// Función para validar los campos de entrada del formulario de restablecimiento de contraseña
export function validatePasswordResetInput({ password, confirmPassword }) {
  if (!password) {
    return "La contraseña es obligatoria.";
  }
  if (password.length < 8) {
    return "La contraseña debe tener al menos 8 caracteres.";
  }
  if (password !== confirmPassword) {
    return "Las contraseñas no coinciden.";
  }
  return null;
}
