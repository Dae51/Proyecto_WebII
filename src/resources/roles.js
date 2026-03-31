export const USER_ROLES = {
  ADMIN: "admin",
  COMPANY_ADMIN: "empresa_admin",
  CLIENT: "cliente",
  EMPLOYEE: "empleado",
};

export const DASHBOARD_ROLES = [
  USER_ROLES.ADMIN,
  USER_ROLES.COMPANY_ADMIN,
  USER_ROLES.EMPLOYEE,
];

export const ROLE_LABELS = {
  [USER_ROLES.ADMIN]: "Administrador",
  [USER_ROLES.COMPANY_ADMIN]: "Administrador de empresa",
  [USER_ROLES.CLIENT]: "Cliente",
  [USER_ROLES.EMPLOYEE]: "Empleado",
};

export function normalizeRole(value) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_");

  if (normalized === "administrador") return USER_ROLES.ADMIN;
  if (normalized === "admin") return USER_ROLES.ADMIN;
  if (normalized === "administrador_de_empresa_ofertante") return USER_ROLES.COMPANY_ADMIN;
  if (normalized === "administrador_empresa") return USER_ROLES.COMPANY_ADMIN;
  if (normalized === "empresa_admin") return USER_ROLES.COMPANY_ADMIN;
  if (normalized === "company_admin") return USER_ROLES.COMPANY_ADMIN;
  if (normalized === "cliente") return USER_ROLES.CLIENT;
  if (normalized === "client") return USER_ROLES.CLIENT;
  if (normalized === "empleado") return USER_ROLES.EMPLOYEE;
  if (normalized === "employee") return USER_ROLES.EMPLOYEE;
  return USER_ROLES.CLIENT;
}

export function getRoleLabel(role) {
  return ROLE_LABELS[normalizeRole(role)] ?? "Cliente";
}

export function userHasRole(role, allowedRoles = []) {
  const currentRole = normalizeRole(role);
  return allowedRoles.map(normalizeRole).includes(currentRole);
}

export function isDashboardRole(role) {
  return userHasRole(role, DASHBOARD_ROLES);
}

export function getDefaultRouteByRole(role) {
  return isDashboardRole(role) ? "/dashboard" : "/";
}
