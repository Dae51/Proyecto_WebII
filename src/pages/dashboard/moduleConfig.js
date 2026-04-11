import { USER_ROLES } from "../../resources/roles";

export const DASHBOARD_MODULES = [
  {
    id: "overview",
    title: "Resumen",
    shortLabel: "Vista general",
    roles: [USER_ROLES.ADMIN, USER_ROLES.COMPANY_ADMIN, USER_ROLES.EMPLOYEE],
  },
  {
    id: "companies",
    title: "Empresas ofertantes",
    shortLabel: "Gestion comercial",
    roles: [USER_ROLES.ADMIN],
  },
  {
    id: "categories",
    title: "Rubros",
    shortLabel: "Catalogo de rubros",
    roles: [USER_ROLES.ADMIN],
  },
  {
    id: "clients",
    title: "Clientes",
    shortLabel: "Seguimiento de clientes",
    roles: [USER_ROLES.ADMIN],
  },
  {
    id: "offers",
    title: "Ofertas",
    shortLabel: "Ciclo de ofertas",
    roles: [USER_ROLES.ADMIN, USER_ROLES.COMPANY_ADMIN],
  },
  {
    id: "redeem",
    title: "Canje de cupones",
    shortLabel: "Validacion de cupones",
    roles: [USER_ROLES.EMPLOYEE],
  },
];
