import React from "react";
import { toast } from "react-toastify";
import { DataTable, SectionCard } from "../../../components/dashboard/ModuleUI";
import {
  normalizeCouponCode,
  normalizeDui,
  validateAndRedeemCoupon,
} from "../../../resources/PurchaseService";

function formatDateTime(value) {
  if (!value) return "Sin registro";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Sin registro";

  return parsed.toLocaleString();
}

function buildHistoryEntry({
  code,
  customer,
  dui,
  status,
  timestamp,
}) {
  return {
    code: code || "Sin codigo",
    customer: customer || "Sin cliente",
    dui: dui || "Sin DUI",
    status,
    timestamp: formatDateTime(timestamp),
  };
}

export default function RedeemModule({ canRedeem }) {
  const [form, setForm] = React.useState({
    code: "",
    dui: "",
  });
  const [submitting, setSubmitting] = React.useState(false);
  const [result, setResult] = React.useState(null);
  const [history, setHistory] = React.useState([]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: name === "dui" ? normalizeDui(value) : normalizeCouponCode(value),
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!canRedeem) {
      toast.error("Solo el personal con rol EMPLEADO puede canjear cupones.");
      return;
    }

    setSubmitting(true);
    setResult(null);

    const { data, error } = await validateAndRedeemCoupon(form);
    setSubmitting(false);

    if (error) {
      setResult({
        type: "error",
        message: error.message || "No se pudo validar y canjear el cupon.",
      });
      setHistory((current) => [
        buildHistoryEntry({
          code: normalizeCouponCode(form.code),
          customer: "No validado",
          dui: normalizeDui(form.dui),
          status: "Error",
          timestamp: new Date().toISOString(),
        }),
        ...current,
      ].slice(0, 6));
      toast.error(error.message || "No se pudo validar y canjear el cupon.");
      return;
    }

    setResult({
      type: "success",
      payload: data,
    });
    setHistory((current) => [
      buildHistoryEntry({
        code: data?.cupon?.code,
        customer: data?.cliente?.nombreCompleto,
        dui: data?.cliente?.dui,
        status: "Canjeado",
        timestamp: data?.canjeadoEn,
      }),
      ...current,
    ].slice(0, 6));
    setForm({
      code: "",
      dui: "",
    });
    toast.success("Cupon validado y canjeado correctamente.");
  }

  if (!canRedeem) {
    return (
      <SectionCard
        title="Canje de cupones"
        subtitle="Solo el personal operativo autorizado puede ejecutar validaciones y canjes."
        actionVisible={false}
      >
        <div className="rounded-3xl border border-rose-400/20 bg-rose-400/10 px-6 py-10 text-center">
          <p className="text-lg font-bold text-rose-400">Acceso restringido</p>
          <p className="mt-2 text-sm text-slate-400">
            Este modulo solo esta disponible para usuarios con rol EMPLEADO.
          </p>
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Canje de cupones"
      subtitle="Valida compras reales por codigo y DUI, evita reutilizaciones y registra la fecha exacta del canje."
      actionVisible={false}
    >
      <div className="grid gap-4 xl:grid-cols-[380px,minmax(0,1fr)]">
        {/* Form */}
        <form onSubmit={handleSubmit} className="rounded-3xl border border-white/10 bg-[#08173d] p-5">
          <h3 className="text-lg font-bold text-white">Formulario de validacion</h3>
          <p className="mt-2 text-sm text-slate-400">
            El sistema buscara el cliente por DUI, el cupon por codigo y la compra disponible asociada.
          </p>

          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400">
                Codigo del cupon
              </span>
              <input
                name="code"
                type="text"
                value={form.code}
                onChange={handleChange}
                placeholder="ABC123"
                autoComplete="off"
                className="bo-input w-full uppercase"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400">
                DUI del cliente
              </span>
              <input
                name="dui"
                type="text"
                value={form.dui}
                onChange={handleChange}
                placeholder="01234567-8"
                autoComplete="off"
                className="bo-input w-full"
              />
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full"
            >
              {submitting ? "Validando y canjeando..." : "Validar y Canjear"}
            </button>
          </div>
        </form>

        {/* Result + History */}
        <div className="space-y-4">
          <div className="rounded-3xl border border-white/10 bg-[#08173d] p-5">
            <h3 className="text-lg font-bold text-white">Resultado</h3>

            {!result ? (
              <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-6 text-sm text-slate-400">
                Ingresa el codigo del cupon y el DUI para validar si existe una compra disponible.
              </div>
            ) : null}

            {result?.type === "error" ? (
              <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-5">
                <p className="text-sm font-bold uppercase tracking-wide text-rose-400">Canje rechazado</p>
                <p className="mt-2 text-sm text-slate-300">{result.message}</p>
              </div>
            ) : null}

            {result?.type === "success" ? (
              <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-5 text-sm text-slate-300">
                <p className="font-bold uppercase tracking-wide text-emerald-400">Canje completado</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <p>
                    <span className="font-semibold text-white">Cliente:</span>{" "}
                    {result.payload.cliente.nombreCompleto}
                  </p>
                  <p>
                    <span className="font-semibold text-white">DUI:</span>{" "}
                    {result.payload.cliente.dui}
                  </p>
                  <p>
                    <span className="font-semibold text-white">Codigo:</span>{" "}
                    {result.payload.cupon.code}
                  </p>
                  <p>
                    <span className="font-semibold text-white">Cupon:</span>{" "}
                    {result.payload.cupon.title}
                  </p>
                  <p>
                    <span className="font-semibold text-white">Compra:</span>{" "}
                    {result.payload.compraId}
                  </p>
                  <p>
                    <span className="font-semibold text-white">Canjeado en:</span>{" "}
                    {formatDateTime(result.payload.canjeadoEn)}
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          {history.length > 0 ? (
            <DataTable
              columns={["Codigo", "Cliente", "DUI", "Estado", "Fecha"]}
              rows={history.map((entry) => [
                entry.code,
                entry.customer,
                entry.dui,
                entry.status,
                entry.timestamp,
              ])}
            />
          ) : (
            <div className="rounded-3xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-slate-400">
              Aun no hay validaciones registradas en esta sesion.
            </div>
          )}
        </div>
      </div>
    </SectionCard>
  );
}
