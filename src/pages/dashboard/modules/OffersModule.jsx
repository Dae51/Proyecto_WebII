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
  deleteCupon,
  generateUniqueCouponCode,
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
  stock: "",
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
    stock: coupon.stock !== undefined && coupon.stock !== null ? String(coupon.stock) : "",
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
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${active
          ? "bg-cyan-950 text-white"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
        }`}
    >
      {label}
    </button>
  );
}

function ActionButton({ tone = "default", disabled = false, onClick, children, className = "" }) {
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
      className={`inline-flex min-h-9 items-center justify-center rounded-full px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${styles} ${className}`}
    >
      {children}
    </button>
  );
}

function CouponForm({
  form,
  previewUrl,
  fileInputKey,
  isEditing,
  saving,
  onSubmit,
  onInputChange,
  onImageChange,
  onCancel,
}) {
  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
        Código (Autogenerado)
        <input
          type="text"
          name="code"
          value={form.code}
          disabled={true}
          readOnly
          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold text-slate-500 outline-none transition disabled:cursor-not-allowed"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
        Título
        <input
          type="text"
          name="title"
          value={form.title}
          onChange={onInputChange}
          placeholder="Ej. 2x1 en Pizza Familiar"
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-medium text-slate-900 outline-none transition focus:border-cyan-900"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
        Categoría
        <select
          name="category"
          value={form.category}
          onChange={onInputChange}
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
          onChange={onInputChange}
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
          onChange={onInputChange}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-medium text-slate-900 outline-none transition focus:border-cyan-900"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
        Stock disponible
        <input
          type="number"
          name="stock"
          min="1"
          step="1"
          value={form.stock}
          onChange={onInputChange}
          placeholder="Ej. 100"
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-medium text-slate-900 outline-none transition focus:border-cyan-900"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
        Imagen
        <input
          key={fileInputKey}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={onImageChange}
          className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-600 outline-none transition file:mr-4 file:rounded-full file:border-0 file:bg-cyan-950 file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-amber-400 hover:file:text-black"
        />
      </label>

      <label className="md:col-span-2 flex flex-col gap-2 text-sm font-semibold text-slate-700">
        Descripción
        <textarea
          name="description"
          value={form.description}
          onChange={onInputChange}
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
          onChange={onInputChange}
          rows={4}
          placeholder="Cada condición puede ir en una línea distinta."
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-medium text-slate-900 outline-none transition focus:border-cyan-900"
        />
      </label>

      <div className="md:col-span-2 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
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
              {isEditing
                ? "Si no seleccionas una nueva imagen, se conserva la actual."
                : "Si no subes imagen, el cupón usará el placeholder público."}
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center rounded-full bg-cyan-950 px-6 py-3 text-sm font-bold text-white transition hover:bg-amber-400 hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving
              ? "Guardando..."
              : isEditing
                ? "Guardar cambios"
                : "Crear cupón"}
          </button>
        </div>
      </div>
    </form>
  );
}

function CouponModal({ isOpen, isBusy, title, subtitle, onClose, children }) {
  React.useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !isBusy) {
        onClose?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isBusy, isOpen, onClose]);

  function handleBackdropClick(event) {
    if (event.target !== event.currentTarget || isBusy) return;
    onClose?.();
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-4 py-6"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="coupon-form-modal-title"
        className="w-full max-w-4xl overflow-hidden rounded-[28px] bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-500">
              Gestión de ofertas
            </p>
            <h3 id="coupon-form-modal-title" className="mt-1 text-2xl font-extrabold text-slate-900">
              {title}
            </h3>
            <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Cerrar formulario de cupón"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                d="M6 6l12 12M18 6L6 18"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <div className="max-h-[calc(100vh-8rem)] overflow-y-auto px-5 py-5 sm:px-6">
          {children}
        </div>
      </div>
    </div>
  );
}

function CouponActions({
  isCompanyAdmin,
  isAdmin,
  saving,
  onEdit,
  onApprove,
  onReject,
  onDelete,
  isPending,
  isRejected
}) {
  const slots = [];

  if (isCompanyAdmin) {
    if (isRejected) {
      slots.push(
        <ActionButton disabled={saving} onClick={onEdit} className="w-full !bg-blue-100 !text-blue-800 hover:!bg-blue-200">
          Revisar/Reenviar
        </ActionButton>
      );
      slots.push(
        <ActionButton tone="danger" disabled={saving} onClick={onDelete} className="w-full">
          Descartar
        </ActionButton>
      );
    } else if (isPending) {
      slots.push(
        <ActionButton disabled={saving} onClick={onEdit} className="w-full">
          Editar
        </ActionButton>
      );
      slots.push(
        <ActionButton tone="danger" disabled={saving} onClick={onDelete} className="w-full">
          Eliminar
        </ActionButton>
      );
    }
  }

  if (isAdmin && isPending) {
    slots.push(
      <ActionButton tone="approve" disabled={saving} onClick={onApprove} className="w-full">
        Aprobar
      </ActionButton>
    );
    slots.push(
      <ActionButton tone="reject" disabled={saving} onClick={onReject} className="w-full">
        Rechazar
      </ActionButton>
    );
  }

  return (
    <div className="flex flex-col gap-2 w-full max-w-[120px]">
      {slots.map((slot, index) => (
        <div key={index} className="w-full">
          {slot}
        </div>
      ))}
    </div>
  );
}

export default function OffersModule() {
  const { role, user } = useAuth();
  const [coupons, setCoupons] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [selectedFilter, setSelectedFilter] = React.useState("todos");
  const [editingCoupon, setEditingCoupon] = React.useState(null);
  const [form, setForm] = React.useState(EMPTY_FORM);
  const [imageFile, setImageFile] = React.useState(null);
  const [previewUrl, setPreviewUrl] = React.useState("");
  const [fileInputKey, setFileInputKey] = React.useState(0);
  const [isFormModalOpen, setIsFormModalOpen] = React.useState(false);

  // Derived authorization bounds
  const rawRoleString = String(role || '').toUpperCase();
  const isAdmin = rawRoleString === 'ADMIN';
  const isCompanyAdmin = rawRoleString === 'EMPRESA_ADMIN' || rawRoleString === 'COMPANY_ADMIN';

  const isEditing = !!editingCoupon;
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

  React.useEffect(() => {
    if (isAdmin && (selectedFilter === "todos" || selectedFilter === COUPON_STATES.ELIMINATED)) {
      setSelectedFilter(COUPON_STATES.PENDING);
    }
  }, [isAdmin, selectedFilter]);

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

  async function openCreateModal() {
    resetForm();
    setIsFormModalOpen(true);

    // Auto-generate the code in advance so they see it
    const newCode = await generateUniqueCouponCode();
    setForm((current) => ({ ...current, code: newCode }));
  }

  function closeFormModal() {
    if (saving) return;
    setIsFormModalOpen(false);
    resetForm();
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
    setIsFormModalOpen(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const previousState = editingCoupon?.state ?? null;
    const wasEditing = !!editingCoupon;

    if (wasEditing && previousState === COUPON_STATES.REJECTED) {
      const originalValues = toFormValues(editingCoupon);
      const hasChanges =
        imageFile !== null ||
        form.title !== originalValues.title ||
        form.description !== originalValues.description ||
        form.terms !== originalValues.terms ||
        form.category !== originalValues.category ||
        form.precio !== originalValues.precio ||
        form.expires_at !== originalValues.expires_at ||
        form.stock !== originalValues.stock;

      if (!hasChanges) {
        toast.info("Debes realizar al menos un cambio en la oferta antes de poder reenviarla a revisión.");
        return;
      }
    }

    setSaving(true);

    const saveAction = wasEditing
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

    if (wasEditing) {
      const returnedToPending =
        previousState === COUPON_STATES.APPROVED &&
        cupon.state === COUPON_STATES.PENDING;

      const forwardedToProcess = 
        previousState === COUPON_STATES.REJECTED && 
        cupon.state === COUPON_STATES.PENDING;

      if (forwardedToProcess) {
        toast.success("Cupón corregido satisfactoriamente. Se ha reenviado para estar PENDIENTE de revisión.");
      } else {
        toast.success(
          returnedToPending
            ? "Cupón actualizado. Volvió a pendiente de aprobación."
            : "Cupón actualizado correctamente."
        );
      }
    } else {
      toast.success("Cupón creado correctamente. Quedó pendiente de aprobación.");
    }

    await loadCoupons({ silent: true });
    setIsFormModalOpen(false);
    resetForm();
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

  async function handlePhysicalDelete(couponId) {
    if (!window.confirm("¿Estás seguro de que deseas eliminar permanentemente este cupón de tu empresa?")) return;

    setSaving(true);
    const { error } = await deleteCupon(couponId);
    setSaving(false);

    if (error) {
      toast.error(error?.message || "No logramos eliminar el cupón base.");
    } else {
      toast.success("Cupón eliminado permanentemente con éxito.");
      setCoupons((curr) => curr.filter((c) => c.id !== couponId));
    }
  }

  return (
    <>
      <SectionCard
        title="Ofertas"
        subtitle="Centro de operación para crear ofertas, revisarlas por estado y publicar solo las aprobadas."
        actionVisible={isCompanyAdmin}
        action={
          isCompanyAdmin ? (
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center justify-center rounded-full bg-cyan-950 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-amber-400 hover:text-black"
            >
              Crear cupón
            </button>
          ) : null
        }
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

        <div className="mt-6 flex flex-wrap gap-2">
          {FILTER_OPTIONS
            .filter(filter => {
              if (isAdmin) {
                return filter.value !== "todos" && filter.value !== COUPON_STATES.ELIMINATED;
              }
              return true;
            })
            .map((filter) => (
              <FilterButton
                key={filter.value}
                active={selectedFilter === filter.value}
                label={filter.label}
                onClick={() => setSelectedFilter(filter.value)}
              />
            ))}
        </div>

        <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto custom-scroll w-full">
            <table className="w-full min-w-[700px] text-left text-sm text-slate-700">
              <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-4 py-3">Cupón</th>
                  <th className="px-4 py-3">Categoría</th>
                  <th className="px-4 py-3">Precio</th>
                  <th className="px-4 py-3">Estado</th>
                  {!isAdmin && <th className="px-4 py-3">Vence</th>}
                  <th className="w-[140px] px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  <tr>
                    <td className="px-4 py-6 text-slate-500 text-center" colSpan={isAdmin ? 5 : 6}>
                      Cargando cupones...
                    </td>
                  </tr>
                ) : filteredCoupons.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 5 : 6} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <svg className="h-16 w-16 text-slate-200 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <h3 className="text-lg font-medium text-slate-900">
                          {selectedFilter === "todos"
                            ? "Espacio de ofertas vacío"
                            : "Bandeja sin hallazgos"}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
                          {selectedFilter === "todos"
                            ? "Aún no has registrado ningún cupón dentro de las ofertas de negocio. Tu equipo lo puede gestionar publicando una ahora mismo."
                            : isAdmin
                              ? "No hay cupones correspondientes al estado seleccionado esperando por tu gestión y supervisión."
                              : "No hay ofertas filtradas en el estado que solicitaste en este momento."}
                        </p>
                        {isCompanyAdmin && selectedFilter === "todos" && (
                          <button
                            type="button"
                            onClick={openCreateModal}
                            className="mt-5 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-full text-white bg-cyan-950 hover:bg-cyan-900 transition-colors"
                          >
                            Nueva oferta
                          </button>
                        )}
                      </div>
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
                              Código: {coupon.code || "Sin código"} &bull; Stock: {coupon.stock || 0}
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
                      {!isAdmin && (
                        <td className="px-4 py-4 text-xs text-slate-500">
                          {formatDateTime(coupon.expires_at)}
                        </td>
                      )}
                      <td className="w-[140px] px-4 py-4">
                        <CouponActions
                          isCompanyAdmin={isCompanyAdmin}
                          isAdmin={isAdmin}
                          isPending={coupon.state === COUPON_STATES.PENDING}
                          isRejected={coupon.state === COUPON_STATES.REJECTED}
                          saving={saving}
                          onEdit={() => handleEdit(coupon)}
                          onApprove={() =>
                            handleStateChange(
                              coupon,
                              COUPON_STATES.APPROVED,
                              "Cupón aprobado y visible en el sitio público."
                            )
                          }
                          onReject={() =>
                            handleStateChange(
                              coupon,
                              COUPON_STATES.REJECTED,
                              "Cupón rechazado correctamente y revertido a su empresa."
                            )
                          }
                          onDelete={() => handlePhysicalDelete(coupon.id)}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </SectionCard>

      <CouponModal
        isOpen={isFormModalOpen}
        isBusy={saving}
        title={isEditing ? "Editar cupón" : "Nuevo cupón"}
        subtitle={
          isEditing
            ? "Actualiza los datos del cupón sin salir del módulo de ofertas."
            : "Completa los datos del cupón. Al guardarlo quedará pendiente de aprobación."
        }
        onClose={closeFormModal}
      >
        <CouponForm
          form={form}
          previewUrl={previewUrl}
          fileInputKey={fileInputKey}
          isEditing={isEditing}
          saving={saving}
          onSubmit={handleSubmit}
          onInputChange={handleInputChange}
          onImageChange={handleImageChange}
          onCancel={closeFormModal}
        />
      </CouponModal>
    </>
  );
}
