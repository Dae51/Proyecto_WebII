import React from "react";
import { DataTable, SectionCard, StatCard } from "../../../components/dashboard/ModuleUI";

const SAMPLE_COMPANIES = [
  { name: "AutoSpa Premium", code: "AUT101", contact: "Maria Flores", commission: "12%", status: "Activa" },
  { name: "Pizza Nova", code: "PIZ202", contact: "Luis Rivera", commission: "15%", status: "Activa" },
  { name: "Clean House", code: "CLN303", contact: "Karen Pena", commission: "10%", status: "En revision" },
];

export default function CompaniesModule({ canManage }) {
  return (
    <SectionCard
      title="Empresas ofertantes"
      subtitle="Vista base para alta, edicion, baja y consulta de desempeno por empresa."
      actionLabel="Nueva empresa"
      actionVisible={canManage}
    >
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Empresas activas" value="12" accent="text-cyan-700" />
        <StatCard title="En revision" value="03" accent="text-amber-500" />
        <StatCard title="Comision promedio" value="12%" accent="text-emerald-600" />
        <StatCard title="Ofertas asociadas" value="27" accent="text-rose-600" />
      </div>
      <div className="mt-6">
        <DataTable
          columns={["Empresa", "Codigo", "Contacto", "Comision", "Estado"]}
          rows={SAMPLE_COMPANIES.map((item) => [item.name, item.code, item.contact, item.commission, item.status])}
        />
      </div>
    </SectionCard>
  );
}
