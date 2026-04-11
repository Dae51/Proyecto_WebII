import React from "react";
import { Link } from "react-router-dom";
import DashboardSidebar from "../../components/dashboard/DashboardSidebar";
import { SectionCard } from "../../components/dashboard/ModuleUI";
import { useAuth } from "../../context/AuthContext";
import { USER_ROLES, userHasRole } from "../../resources/roles";
import { DASHBOARD_MODULES } from "./moduleConfig";
import CategoriesModule from "./modules/CategoriesModule";
import ClientsModule from "./modules/ClientsModule";
import CompaniesModule from "./modules/CompaniesModule";
import OffersModule from "./modules/OffersModule";
import OverviewModule from "./modules/OverviewModule";
import RedeemModule from "./modules/RedeemModule";

const ROLE_SUMMARY = {
  [USER_ROLES.ADMIN]: {
    title: "Control total del negocio",
    text: "Puedes supervisar clientes, rubros y el proceso de aprobacion de ofertas.",
  },
  [USER_ROLES.COMPANY_ADMIN]: {
    title: "Operacion de empresa ofertante",
    text: "Tu panel esta enfocado en ofertas, empleados y rendimiento comercial de tu empresa.",
  },
  [USER_ROLES.EMPLOYEE]: {
    title: "Operacion de canje",
    text: "Tu acceso esta restringido al flujo de validacion y canje de cupones en sucursal.",
  },
};


export default function Dashboard() {
  const { metadata, role, roleLabel } = useAuth();
  const visibleModules = DASHBOARD_MODULES.filter((module) => userHasRole(role, module.roles));
  const [activeModuleId, setActiveModuleId] = React.useState(visibleModules[0]?.id ?? "overview");
  const summary = ROLE_SUMMARY[role] ?? ROLE_SUMMARY[USER_ROLES.EMPLOYEE];
  const userName =
    metadata.full_name ||
    [metadata.first_name, metadata.last_name].filter(Boolean).join(" ") ||
    "Usuario";

  React.useEffect(() => {
    if (!visibleModules.some((module) => module.id === activeModuleId)) {
      setActiveModuleId(visibleModules[0]?.id ?? "overview");
    }
  }, [activeModuleId, visibleModules]);

  function renderModule() {
    switch (activeModuleId) {
      case "companies":
        return <CompaniesModule canManage={role === USER_ROLES.COMPANY_ADMIN} />;
      case "categories":
        return <CategoriesModule canManage={role === USER_ROLES.ADMIN} />;
      case "clients":
        return <ClientsModule />;
      case "offers":
        return (
          <OffersModule
            canApprove={role === USER_ROLES.ADMIN}
            canCreate={userHasRole(role, [USER_ROLES.ADMIN, USER_ROLES.COMPANY_ADMIN])}
          />
        );
      case "redeem":
        return <RedeemModule canRedeem={userHasRole(role, [USER_ROLES.EMPLOYEE])} />;
      case "overview":
      default:
        return (
          <OverviewModule
            summary={summary}
            roleLabel={roleLabel}
            visibleModules={visibleModules}
            allModules={DASHBOARD_MODULES}
          />
        );
    }
  }

  return (
    <div className="min-h-screen bg-[#020b24] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <div className="w-full lg:sticky lg:top-6 lg:w-[300px] lg:flex-shrink-0">
            <DashboardSidebar
              modules={visibleModules}
              activeModuleId={activeModuleId}
              onSelect={setActiveModuleId}
              roleLabel={roleLabel}
              userName={userName}
            />
          </div>

          <main className="w-full min-w-0 flex-1 space-y-6">
            {renderModule()}
          </main>
        </div>
      </div>
    </div>
  );
}
