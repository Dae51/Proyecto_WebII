import React from "react";
import { DataTable, SectionCard } from "../../../components/dashboard/ModuleUI";

const SAMPLE_REDEMPTIONS = [
  { code: "PIZ202-1029384", customer: "Claudia Cliente", dui: "01234567-8", status: "Disponible" },
  { code: "AUT101-2093847", customer: "Mario Lopez", dui: "12345678-9", status: "Canjeado" },
  { code: "CLN303-9837462", customer: "Sofia Garcia", dui: "23456789-0", status: "Vencido" },
];

export default function RedeemModule({ canRedeem }) {
  return (
    <SectionCard
      title="Canje de cupones"
      subtitle="Busqueda y validacion del cupon por codigo y DUI del comprador."
      actionLabel="Buscar cupon"
      actionVisible={canRedeem}
    >
      <div className="grid gap-4 xl:grid-cols-[360px,minmax(0,1fr)]">
        <div className="rounded-3xl bg-slate-100 p-5">
          <h3 className="text-lg font-bold text-slate-900">Formulario de validacion</h3>
          <div className="mt-4 space-y-3">
            <input
              type="text"
              placeholder="Codigo del cupon"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              readOnly
            />
            <input
              type="text"
              placeholder="DUI del cliente"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              readOnly
            />
            {canRedeem ? (
              <button
                type="button"
                className="w-full rounded-2xl bg-cyan-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-amber-400 hover:text-black"
              >
                Validar canje
              </button>
            ) : null}
          </div>
        </div>
        <DataTable
          columns={["Codigo", "Cliente", "DUI", "Estado"]}
          rows={SAMPLE_REDEMPTIONS.map((item) => [item.code, item.customer, item.dui, item.status])}
        />
      </div>
    </SectionCard>
  );
}
