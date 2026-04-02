import React from "react";
import { toast } from "react-toastify";
import { useAuth } from "../../../context/AuthContext";
import {
  CATEGORY_OPTIONS,
  COUPON_STATES,
  createCupon,
  getAdminCupones,
  getCouponStateLabel,
  updateCupon,
  updateCuponState,
} from "../../../resources/CuponesService";
import { SectionCard, StatCard } from "../../../components/dashboard/ModuleUI";

const FILTER_OPTIONS = [
  { value: "todos", label: "Todos" },
  { value: COUPON_STATES.PENDING, label: "Pendiente de aprobación" },
  { value: COUPON_STATES.APPROVED, label: "Aprobado" },
  { value: COUPON_STATES.REJECTED, label: "Rechazado" },
  { value: COUPON_STATES.ELIMINATED, label: "Eliminado" },
];

const EMPTY_FORM = {
  code: "",
  title: "",
  description: "",
  terms: "",
  category: CATEGORY_OPTIONS[0]?.value ?? "Restaurante",
  precio: "",
  expires_at: "",
};

const STATE_BADGE_STYLES = {
  [COUPON_STATES.PENDING]: "bg-amber-100 text-amber-900",
  [COUPON_STATES.APPROVED]: "bg-emerald-100 text-emerald-800",
  [COUPON_STATES.REJECTED]: "bg-rose-100 text-rose-700",
  [COUPON_STATES.ELIMINATED]: "bg-slate-200 text-slate-700",
};

function formatCurrency(value) {
  const amount = Number(value);
  return Number.isFinite(amount) ? `$${amount.toFixed(2)}` : "$0.00";
}

function formatDateTime(value) {
  if (!value) return "Sin fecha";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";

  return new Intl.DateTimeFormat("es-SV", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function toDateTimeLocal(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}

function toFormValues(coupon) {
  if (!coupon) return EMPTY_FORM;

  return {
    code: coupon.code ?? "",
    title: coupon.title ?? "",
    description: coupon.description ?? "",
    terms: coupon.terms ?? "",
    category: coupon.category ?? EMPTY_FORM.category,
    precio: coupon.precio ? String(coupon.precio) : "",
    expires_at: toDateTimeLocal(coupon.expires_at),
  };
}

function StateBadge({ state }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${STATE_BADGE_STYLES[state] ?? "bg-slate-100 text-slate-700"}`}
    >
      {getCouponStateLabel(state)}
    </span>
  );
}

function FilterButton({ active, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
        active
          ? "bg-cyan-950 text-white"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
      }`}
    >
      {label}
    </button>
  );
}

function ActionButton({ tone = "default", disabled = false, onClick, children }) {
  const styles =
    tone === "approve"
      ? "bg-emerald-600 text-white hover:bg-emerald-700"
      : tone === "reject"
        ? "bg-rose-600 text-white hover:bg-rose-700"
        : tone === "danger"
          ? "bg-slate-800 text-white hover:bg-black"
          : "bg-slate-100 text-slate-800 hover:bg-slate-200";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${styles}`}
    >
      {children}
    </button>
  );
}

export default function OffersModule({ canApprove, canCreate }) {
  const { user } = useAuth();
  const [coupons, setCoupons] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [selectedFilter, setSelectedFilter] = React.useState("todos");
  const [editingCoupon, setEditingCoupon] = React.useState(null);
  const [form, setForm] = React.useState(EMPTY_FORM);
  const [imageFile, setImageFile] = React.useState(null);
  const [previewUrl, setPreviewUrl] = React.useState("");
  const [fileInputKey, setFileInputKey] = React.useState(0);

  const currentImage = editingCoupon?.image_url ?? "";

  const loadCoupons = React.useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
    }

    const { cupones, error } = await getAdminCupones();

    if (error) {
      toast.error(error.message || "No se pudo cargar el listado de cupones.");
      setCoupons([]);
      setLoading(false);
      return;
    }

    setCoupons(cupones);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);

  React.useEffect(() => {
    if (!imageFile) {
      setPreviewUrl(currentImage);
      return undefined;
    }

    const objectUrl = URL.createObjectURL(imageFile);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [currentImage, imageFile]);

  const counts = React.useMemo(() => {
    return coupons.reduce(
      (accumulator, coupon) => {
        accumulator.total += 1;
        accumulator[coupon.state] = (accumulator[coupon.state] ?? 0) + 1;
        return accumulator;
      },
      {
        total: 0,
        [COUPON_STATES.PENDING]: 0,
        [COUPON_STATES.APPROVED]: 0,
        [COUPON_STATES.REJECTED]: 0,
        [COUPON_STATES.ELIMINATED]: 0,
      }
    );
  }, [coupons]);

  const filteredCoupons = React.useMemo(() => {
    if (selectedFilter === "todos") return coupons;
    return coupons.filter((coupon) => coupon.state === selectedFilter);
  }, [coupons, selectedFilter]);

  function resetForm() {
    setEditingCoupon(null);
    setForm(EMPTY_FORM);
    setImageFile(null);
    setPreviewUrl("");
    setFileInputKey((value) => value + 1);
  }

  function handleInputChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleImageChange(event) {
    const file = event.target.files?.[0] ?? null;
    setImageFile(file);
  }

  function handleEdit(coupon) {
    setEditingCoupon(coupon);
    setForm(toFormValues(coupon));
    setImageFile(null);
    setPreviewUrl(coupon.image_url ?? "");
    setFileInputKey((value) => value + 1);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setSaving(true);

    const saveAction = editingCoupon
      ? updateCupon({
          couponId: editingCoupon.id,
          values: form,
          imageFile,
          currentImage: editingCoupon.image_url,
          userId: user?.id,
        })
      : createCupon({
          values: form,
          imageFile,
          userId: user?.id,
        });

    const { cupon, error } = await saveAction;
    setSaving(false);

    if (error || !cupon) {
      toast.error(error?.message || "No se pudo guardar el cupón.");
      return;
    }

    if (editingCoupon) {
      const returnedToPending =
        editingCoupon.state === COUPON_STATES.APPROVED &&
        cupon.state === COUPON_STATES.PENDING;

      toast.success(
        returnedToPending
          ? "Cupón actualizado. Volvió a pendiente de aprobación."
          : "Cupón actualizado correctamente."
      );
    } else {
      toast.success("Cupón creado correctamente. Quedó pendiente de aprobación.");
    }

    resetForm();
    await loadCoupons({ silent: true });
  }

  async function handleStateChange(coupon, nextState, successMessage) {
    if (coupon.state === nextState) {
      toast.info(`El cupón ya está en estado ${getCouponStateLabel(nextState).toLowerCase()}.`);
      return;
    }

    setSaving(true);
    const { cupon, error } = await updateCuponState(coupon.id, nextState);
    setSaving(false);

    if (error || !cupon) {
      toast.error(error?.message || "No se pudo actualizar el estado del cupón.");
      return;
    }

    toast.success(successMessage);
    await loadCoupons({ silent: true });

    if (editingCoupon?.id === coupon.id) {
      setEditingCoupon(cupon);
      setForm(toFormValues(cupon));
      setPreviewUrl(cupon.image_url ?? "");
    }
  }

  return (
    <SectionCard
      title="Ofertas"
      subtitle="Centro de operación para crear ofertas, revisarlas por estado y publicar solo las aprobadas."
      actionVisible={false}
    >
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Pendientes"
          value={String(counts[COUPON_STATES.PENDING]).padStart(2, "0")}
          accent="text-amber-500"
          helper="Esperan revisión administrativa"
        />
        <StatCard
          title="Aprobadas"
          value={String(counts[COUPON_STATES.APPROVED]).padStart(2, "0")}
          accent="text-emerald-600"
          helper="Ya visibles en el sitio público"
        />
        <StatCard
          title="Rechazadas"
          value={String(counts[COUPON_STATES.REJECTED]).padStart(2, "0")}
          accent="text-rose-600"
          helper="No se publican en catálogo"
        />
        <StatCard
          title="Eliminadas"
          value={String(counts[COUPON_STATES.ELIMINATED]).padStart(2, "0")}
          accent="text-slate-700"
          helper="Se conservan de forma lógica"
        />
      </div>

      {canCreate && (
        <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-900">
                {editingCoupon ? "Editar cupón" : "Nuevo cupón"}
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                {editingCoupon
                  ? "Actualiza los datos del cupón sin salir del dashboard."
                  : "Los nuevos cupones quedan en revisión antes de publicarse."}
              </p>
            </div>
            {editingCoupon ? (
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-100"
              >
                Cancelar edición
              </button>
            ) : null}
          </div>

          <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
              Código
              <input
                type="text"
                name="code"
                value={form.code}
                onChange={handleInputChange}
                placeholder="Ej. PIZZA2X1"
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-medium text-slate-900 outline-none transition focus:border-cyan-900"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
              Título
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleInputChange}
                placeholder="Ej. 2x1 en Pizza Familiar"
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-medium text-slate-900 outline-none transition focus:border-cyan-900"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
              Categoría
              <select
                name="category"
                value={form.category}
                onChange={handleInputChange}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-medium text-slate-900 outline-none transition focus:border-cyan-900"
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
              Precio
              <input
                type="number"
                name="precio"
                min="0"
                step="0.01"
                value={form.precio}
                onChange={handleInputChange}
                placeholder="19.99"
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-medium text-slate-900 outline-none transition focus:border-cyan-900"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
              Fecha de vencimiento
              <input
                type="datetime-local"
                name="expires_at"
                value={form.expires_at}
                onChange={handleInputChange}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-medium text-slate-900 outline-none transition focus:border-cyan-900"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
              Imagen
              <input
                key={fileInputKey}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleImageChange}
                className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-600 outline-none transition file:mr-4 file:rounded-full file:border-0 file:bg-cyan-950 file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-amber-400 hover:file:text-black"
              />
            </label>

            <label className="md:col-span-2 flex flex-col gap-2 text-sm font-semibold text-slate-700">
              Descripción
              <textarea
                name="description"
                value={form.description}
                onChange={handleInputChange}
                rows={4}
                placeholder="Describe el beneficio principal del cupón."
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-medium text-slate-900 outline-none transition focus:border-cyan-900"
              />
            </label>

            <label className="md:col-span-2 flex flex-col gap-2 text-sm font-semibold text-slate-700">
              Términos y condiciones
              <textarea
                name="terms"
                value={form.terms}
                onChange={handleInputChange}
                rows={4}
                placeholder="Cada condición puede ir en una línea distinta."
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-medium text-slate-900 outline-none transition focus:border-cyan-900"
              />
            </label>

            <div className="md:col-span-2 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="flex items-center gap-4">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt={form.title || "Vista previa del cupón"}
                    className="h-24 w-32 rounded-2xl object-cover shadow-sm"
                  />
                ) : (
                  <div className="flex h-24 w-32 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white text-xs font-semibold text-slate-400">
                    Sin imagen
                  </div>
                )}
                <div className="text-sm text-slate-500">
                  <p>Formatos permitidos: JPG, PNG y WEBP.</p>
                  <p>
                    {editingCoupon
                      ? "Si no seleccionas una nueva imagen, se conserva la actual."
                      : "Si no subes imagen, el cupón usará el placeholder público."}
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center rounded-full bg-cyan-950 px-6 py-3 text-sm font-bold text-white transition hover:bg-amber-400 hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? "Guardando..."
                  : editingCoupon
                    ? "Guardar cambios"
                    : "Crear cupón"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((filter) => (
          <FilterButton
            key={filter.value}
            active={selectedFilter === filter.value}
            label={filter.label}
            onClick={() => setSelectedFilter(filter.value)}
          />
        ))}
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-4 py-3">Cupón</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3">Precio</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Vence</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={6}>
                    Cargando cupones...
                  </td>
                </tr>
              ) : filteredCoupons.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={6}>
                    No hay cupones para el filtro seleccionado.
                  </td>
                </tr>
              ) : (
                filteredCoupons.map((coupon) => (
                  <tr key={coupon.id} className="align-top">
                    <td className="px-4 py-4">
                      <div className="flex items-start gap-3">
                        {coupon.image_url ? (
                          <img
                            src={coupon.image_url}
                            alt={coupon.title}
                            className="h-14 w-20 rounded-2xl object-cover"
                          />
                        ) : (
                          <div className="flex h-14 w-20 items-center justify-center rounded-2xl bg-slate-100 text-[10px] font-bold text-slate-400">
                            Sin imagen
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900">{coupon.title}</p>
                          <p className="mt-1 text-xs font-medium text-slate-500">
                            Código: {coupon.code || "Sin código"}
                          </p>
                          <p className="mt-2 line-clamp-2 text-xs text-slate-500">
                            {coupon.description || "Sin descripción"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">{coupon.category}</td>
                    <td className="px-4 py-4 font-semibold">{formatCurrency(coupon.precio)}</td>
                    <td className="px-4 py-4">
                      <StateBadge state={coupon.state} />
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-500">
                      {formatDateTime(coupon.expires_at)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        {canCreate ? (
                          <ActionButton disabled={saving} onClick={() => handleEdit(coupon)}>
                            Editar
                          </ActionButton>
                        ) : null}

                        {canApprove ? (
                          <>
                            <ActionButton
                              tone="approve"
                              disabled={saving}
                              onClick={() =>
                                handleStateChange(
                                  coupon,
                                  COUPON_STATES.APPROVED,
                                  "Cupón aprobado y visible en el sitio público."
                                )
                              }
                            >
                              Aprobar
                            </ActionButton>
                            <ActionButton
                              tone="reject"
                              disabled={saving}
                              onClick={() =>
                                handleStateChange(
                                  coupon,
                                  COUPON_STATES.REJECTED,
                                  "Cupón rechazado correctamente."
                                )
                              }
                            >
                              Rechazar
                            </ActionButton>
                            <ActionButton
                              tone="danger"
                              disabled={saving}
                              onClick={() =>
                                handleStateChange(
                                  coupon,
                                  COUPON_STATES.ELIMINATED,
                                  "Cupón marcado como eliminado."
                                )
                              }
                            >
                              Eliminar
                            </ActionButton>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </SectionCard>
  );
}
