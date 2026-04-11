import React from "react";
import { SectionCard, StatCard, ActionPills } from "../../../components/dashboard/ModuleUI";

const METRIC_CARDS = [
  {
    title: "Ofertas activas",
    value: "32",
    accent: "text-amber-300",
    helper: "Descuentos actualmente publicados",
  },
  {
    title: "Empleados autorizados",
    value: "12",
    accent: "text-cyan-300",
    helper: "Personal con acceso al dashboard",
  },
  {
    title: "Clientes activos",
    value: "1.2K",
    accent: "text-emerald-300",
    helper: "Usuarios con actividad reciente",
  },
  {
    title: "Tasa de aprobación",
    value: "89%",
    accent: "text-violet-300",
    helper: "Ofertas aprobadas en el último mes",
  },
];

export default function OverviewModule({ summary, roleLabel, visibleModules, allModules, userName, userEmail }) {
  const moduleCards = visibleModules.filter((module) => module.id !== "overview");

  return (
    <div className="space-y-6">
      <SectionCard
        title="Resumen ejecutivo"
        subtitle="Métricas clave y estado operativo para tu empresa en un solo vistazo."
        actionLabel="Volver a la tienda"
        actionHref="/"
      >
        <div className="grid gap-4 md:grid-cols-4">
          {METRIC_CARDS.map((metric) => (
            <StatCard
              key={metric.title}
              title={metric.title}
              value={metric.value}
              accent={metric.accent}
              helper={metric.helper}
            />
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Metricas clave"
        subtitle="Indicadores de rendimiento y crecimiento de la cuponera.">
        <div className="grid gap-4 xl:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-[#08173d] p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-400">Ventas mensuales</p>
                <h3 className="mt-3 text-2xl font-black text-white">$24.8K</h3>
              </div>
              <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">+14% mes</span>
            </div>
            <div className="mt-8 space-y-2">
              {[
                { label: 'Ene', value: 38 },
                { label: 'Feb', value: 45 },
                { label: 'Mar', value: 57 },
                { label: 'Abr', value: 62 },
                { label: 'May', value: 78 },
                { label: 'Jun', value: 95 },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3 text-sm text-slate-300">
                  <span className="w-10">{item.label}</span>
                  <div className="h-2 w-full rounded-full bg-white/10">
                    <div className="h-2 rounded-full bg-gradient-to-r from-amber-300 to-amber-400" style={{ width: `${item.value}%` }} />
                  </div>
                  <span className="w-10 text-right text-slate-300">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#08173d] p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-400">Crecimiento de clientes</p>
                <h3 className="mt-3 text-2xl font-black text-white">1.2K</h3>
              </div>
              <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-300">+9% último trimestre</span>
            </div>
            <div className="mt-8 grid gap-3">
              {[
                { label: 'Nuevos', value: 42, color: 'bg-cyan-400' },
                { label: 'Recurrentes', value: 78, color: 'bg-emerald-400' },
                { label: 'Inactivos', value: 18, color: 'bg-slate-500' },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between text-sm text-slate-400">
                    <span>{item.label}</span>
                    <span>{item.value}%</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-white/10">
                    <div className={`h-2 rounded-full ${item.color}`} style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#08173d] p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-400">Ofertas aprobadas</p>
                <h3 className="mt-3 text-2xl font-black text-white">89%</h3>
              </div>
              <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/5">
                <span className="text-lg font-bold text-emerald-300">89%</span>
              </div>
            </div>
            <div className="mt-8 space-y-4 text-sm text-slate-300">
              <div className="rounded-2xl bg-white/5 p-4">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Rechazadas</span>
                  <span>7%</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-white/10">
                  <div className="h-2 rounded-full bg-rose-400" style={{ width: '7%' }} />
                </div>
              </div>
              <div className="rounded-2xl bg-white/5 p-4">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Pendientes</span>
                  <span>4%</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-white/10">
                  <div className="h-2 rounded-full bg-amber-400" style={{ width: '4%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
