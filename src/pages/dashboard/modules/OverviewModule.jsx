import React from "react";
import { SectionCard, StatCard, ActionPills } from "../../../components/dashboard/ModuleUI";

export default function OverviewModule({ summary, roleLabel, visibleModules, allModules, userName, userEmail }) {
  return (
    <div className="space-y-6">
      <SectionCard
        title={summary.title}
        subtitle={summary.text}
        actionLabel="Volver a la tienda"
        actionHref="/"
      >
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard title="Rol activo" value={roleLabel} accent="text-cyan-700" helper="Se detecta desde user_metadata.role" />
          <StatCard title="Modulos habilitados" value={String(visibleModules.length).padStart(2, "0")} accent="text-emerald-600" helper="Visibles en el sidebar" />
          <StatCard title="Acciones restringidas" value={String(allModules.length - visibleModules.length).padStart(2, "0")} accent="text-rose-600" helper="Ocultas para este nivel de acceso" />
        </div>
      </SectionCard>
      
      <SectionCard
        title="Modulos disponibles"
        subtitle="Los accesos y botones visibles cambian segun el rol autenticado."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          {visibleModules.filter((module) => module.id !== "overview").map((module) => (
            <div key={module.id} className="rounded-3xl border border-slate-200 p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-bold text-slate-900">{module.title}</h3>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Habilitado
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-600">{module.shortLabel}</p>
              <div className="mt-4">
                <ActionPills actions={["Visible en sidebar", "Contenido dinamico", "Acciones por rol"]} />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
