import React from "react";
import { DataTable, SectionCard, StatCard } from "../../../components/dashboard/ModuleUI";

const SAMPLE_OFFERS = [
  { title: "2x1 en Pizza", company: "Pizza Nova", status: "Aprobada", sold: 46, available: 54 },
  { title: "50% Lavado Premium", company: "AutoSpa Premium", status: "Activa", sold: 31, available: 19 },
  { title: "Spa de manos", company: "Beauty House", status: "En espera", sold: 0, available: 40 },
];

export default function OffersModule({ canApprove, canCreate }) {
  return (
    <SectionCard
      title="Ofertas"
      subtitle="Centro de operacion para ofertas en espera, aprobadas, activas, pasadas, rechazadas o descartadas."
      actionLabel={canApprove ? "Revisar aprobaciones" : "Crear oferta"}
      actionVisible={canApprove || canCreate}
    >
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="En espera" value="04" accent="text-amber-500" />
        <StatCard title="Activas" value="09" accent="text-emerald-600" />
        <StatCard title="Rechazadas" value="02" accent="text-rose-600" />
        <StatCard title="Pasadas" value="11" accent="text-cyan-700" />
      </div>
      <div className="mt-6">
        <DataTable
          columns={["Oferta", "Empresa", "Estado", "Vendidos", "Disponibles"]}
          rows={SAMPLE_OFFERS.map((item) => [item.title, item.company, item.status, String(item.sold), String(item.available)])}
        />
      </div>
    </SectionCard>
  );
}
