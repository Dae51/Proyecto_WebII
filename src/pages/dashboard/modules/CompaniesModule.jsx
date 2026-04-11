import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { DataTable, SectionCard, StatCard } from "../../../components/dashboard/ModuleUI";
import { fetchCategorias } from "../../../resources/CategoryService";
import {
  fetchManagedEmpresa,
  generateUniqueEmpresaCode,
  saveManagedEmpresa,
} from "../../../resources/EmpresasService";

const EMPTY_FORM = {
  name: "",
  code: "",
  address: "",
  contact_name: "",
  phone: "",
  mail: "",
  category: "",
};

const CODE_PATTERN = /^[A-Z]{3}[0-9]{3}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9]{4}-[0-9]{4}$/;

function getCategoryLabel(category) {
  return category?.categories ?? category?.name ?? category?.nombre ?? `Categoría ${category?.id ?? ""}`;
}

function getCategoryOptionValue(category) {
  const nameValue = getCategoryLabel(category);
  return String(nameValue || category?.id || "");
}

function resolveCategoryValue(rawValue, categories) {
  const value = String(rawValue ?? "").trim();
  if (!value) return "";

  const match = categories.find((category) => {
    const categoryLabel = getCategoryLabel(category);
    return (
      String(category?.id) === value ||
      getCategoryOptionValue(category) === value ||
      categoryLabel.toLowerCase() === value.toLowerCase()
    );
  });

  return match ? getCategoryOptionValue(match) : value;
}

function formatDate(value) {
  if (!value) return "Sin fecha";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";

  return new Intl.DateTimeFormat("es-SV", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function EmpresaModal({
  isOpen,
  title,
  formData,
  errors,
  categories,
  isSubmitting,
  isPreparingCode,
  onClose,
  onSubmit,
  onFieldChange,
  onPhoneChange,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-sm">
      <div className="custom-scroll relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[28px] border border-white/10 bg-[#07142f] p-6 shadow-2xl md:p-8">
        <div className="mb-6">
          <h3 className="text-2xl font-black text-white">{title}</h3>
          <p className="mt-2 text-sm text-slate-400">
            Esta información identifica a tu negocio dentro del panel y de los cupones publicados.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="bo-label">Nombre de la empresa</label>
              <input
                type="text"
                value={formData.name}
                onChange={(event) => onFieldChange("name", event.target.value)}
                placeholder="Ej. Café Central S.A. de C.V."
                className={errors.name ? "bo-input-error" : "bo-input"}
                disabled={isSubmitting}
              />
              {errors.name ? <span className="text-xs font-semibold text-rose-400">{errors.name}</span> : null}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="bo-label">Código</label>
              <input
                type="text"
                value={isPreparingCode ? "Generando..." : formData.code}
                readOnly
                className={`bo-input cursor-not-allowed font-mono tracking-[0.25em] opacity-60 ${isPreparingCode ? "animate-pulse" : ""}`}
              />
              {errors.code ? <span className="text-xs font-semibold text-rose-400">{errors.code}</span> : null}
              <span className="text-xs font-semibold text-slate-500">
                Se genera automáticamente con el patrón AAA000.
              </span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="bo-label">Correo electrónico</label>
              <input
                type="email"
                value={formData.mail}
                onChange={(event) => onFieldChange("mail", event.target.value)}
                placeholder="contacto@empresa.com"
                className={errors.mail ? "bo-input-error" : "bo-input"}
                disabled={isSubmitting}
              />
              {errors.mail ? <span className="text-xs font-semibold text-rose-400">{errors.mail}</span> : null}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="bo-label">Teléfono</label>
              <input
                type="text"
                inputMode="numeric"
                value={formData.phone}
                onChange={onPhoneChange}
                placeholder="####-####"
                className={errors.phone ? "bo-input-error font-mono" : "bo-input font-mono"}
                disabled={isSubmitting}
              />
              {errors.phone ? <span className="text-xs font-semibold text-rose-400">{errors.phone}</span> : null}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="bo-label">Dirección</label>
            <input
              type="text"
              value={formData.address}
              onChange={(event) => onFieldChange("address", event.target.value)}
              placeholder="Ej. Calle El Mirador, local 12"
              className={errors.address ? "bo-input-error" : "bo-input"}
              disabled={isSubmitting}
            />
            {errors.address ? <span className="text-xs font-semibold text-rose-400">{errors.address}</span> : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="bo-label">Encargado principal</label>
              <input
                type="text"
                value={formData.contact_name}
                onChange={(event) => onFieldChange("contact_name", event.target.value)}
                placeholder="Ej. Ana Martínez"
                className={errors.contact_name ? "bo-input-error" : "bo-input"}
                disabled={isSubmitting}
              />
              {errors.contact_name ? (
                <span className="text-xs font-semibold text-rose-400">{errors.contact_name}</span>
              ) : null}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="bo-label">Categoría</label>
              <select
                value={formData.category}
                onChange={(event) => onFieldChange("category", event.target.value)}
                className={errors.category ? "bo-input-error" : "bo-input"}
                disabled={isSubmitting || categories.length === 0}
              >
                <option value="" className="bg-[#07142f] text-slate-300">
                  Selecciona una categoría
                </option>
                {categories.map((category) => (
                  <option
                    key={category.id ?? getCategoryOptionValue(category)}
                    value={getCategoryOptionValue(category)}
                    className="bg-[#07142f] text-white"
                  >
                    {getCategoryLabel(category)}
                  </option>
                ))}
              </select>
              {errors.category ? <span className="text-xs font-semibold text-rose-400">{errors.category}</span> : null}
              {categories.length === 0 ? (
                <span className="text-xs font-semibold text-amber-300">
                  Aún no hay categorías registradas para asignar a tu empresa.
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-white/10 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={isSubmitting || isPreparingCode}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting || isPreparingCode}
            >
              {isSubmitting ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CompaniesModule({ canManage }) {
  const [empresa, setEmpresa] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [canCreate, setCanCreate] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreparingCode, setIsPreparingCode] = useState(false);

  const loadModuleData = React.useCallback(async () => {
    setLoading(true);
    setLoadError("");

    const [empresaResult, categoriasResult] = await Promise.all([
      fetchManagedEmpresa(),
      fetchCategorias(),
    ]);

    if (categoriasResult.error) {
      toast.error(`No se pudieron cargar las categorías: ${categoriasResult.error.message}`);
      setCategorias([]);
    } else {
      setCategorias(categoriasResult.data ?? []);
    }

    if (empresaResult.error) {
      setEmpresa(null);
      setCanCreate(Boolean(empresaResult.canCreate));
      setLoadError(empresaResult.error.message);
    } else {
      setEmpresa(empresaResult.data ?? null);
      setCanCreate(Boolean(empresaResult.canCreate));
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadModuleData();
  }, [loadModuleData]);

  const handleFieldChange = (field, value) => {
    setFormData((previous) => ({ ...previous, [field]: value }));

    if (errors[field]) {
      setErrors((previous) => ({ ...previous, [field]: "" }));
    }
  };

  const handlePhoneChange = (event) => {
    let value = event.target.value.replace(/\D/g, "");
    if (value.length > 8) value = value.slice(0, 8);
    if (value.length > 4) value = `${value.slice(0, 4)}-${value.slice(4)}`;
    handleFieldChange("phone", value);
  };

  const openCreateModal = async () => {
    setErrors({});
    setFormData(EMPTY_FORM);
    setModalOpen(true);
    setIsPreparingCode(true);

    try {
      const code = await generateUniqueEmpresaCode();
      setFormData((previous) => ({ ...previous, code }));
    } catch (error) {
      toast.error(`No se pudo generar el código de empresa: ${error.message}`);
    } finally {
      setIsPreparingCode(false);
    }
  };

  const openEditModal = () => {
    if (!empresa) return;

    setErrors({});
    setFormData({
      name: empresa.name ?? "",
      code: empresa.code ?? "",
      address: empresa.address ?? "",
      contact_name: empresa.contact_name ?? "",
      phone: empresa.phone ?? "",
      mail: empresa.mail ?? "",
      category: resolveCategoryValue(empresa.category, categorias),
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    if (isSubmitting || isPreparingCode) return;
    setModalOpen(false);
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!formData.name.trim()) {
      nextErrors.name = "El nombre de la empresa es obligatorio.";
    }

    if (!CODE_PATTERN.test(formData.code.trim())) {
      nextErrors.code = "El código debe tener el formato AAA000.";
    }

    if (!formData.address.trim()) {
      nextErrors.address = "La dirección es obligatoria.";
    }

    if (!formData.contact_name.trim()) {
      nextErrors.contact_name = "Debes indicar el nombre del encargado.";
    }

    if (!EMAIL_PATTERN.test(formData.mail.trim())) {
      nextErrors.mail = "Ingresa un correo electrónico válido.";
    }

    if (!PHONE_PATTERN.test(formData.phone.trim())) {
      nextErrors.phone = "El teléfono debe tener el formato ####-####.";
    }

    if (!formData.category.trim()) {
      nextErrors.category = "Selecciona una categoría.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    const { error, mode } = await saveManagedEmpresa(formData);

    if (error) {
      toast.error(error.message);
      setIsSubmitting(false);
      return;
    }

    toast.success(mode === "create" ? "Tu empresa fue registrada correctamente." : "La empresa se actualizó correctamente.");
    setModalOpen(false);
    setIsSubmitting(false);
    await loadModuleData();
  };

  const actionLabel = empresa ? "Editar mi empresa" : "Registrar mi empresa";
  const actionDisabled = loading || isSubmitting || isPreparingCode || categorias.length === 0 || Boolean(loadError);

  const rows = empresa
    ? [[
        <div className="flex flex-col">
          <span className="font-bold text-white">{empresa.name}</span>
          <span className="text-xs text-slate-400">{empresa.address || "Sin dirección registrada"}</span>
        </div>,
        <span className="rounded-md border border-amber-400/20 bg-amber-400/10 px-2 py-1 font-mono text-xs font-semibold tracking-widest text-amber-300">
          {empresa.code}
        </span>,
        <div className="flex flex-col">
          <span className="text-slate-200">{empresa.contact_name}</span>
          <span className="text-xs text-slate-500">{empresa.mail}</span>
        </div>,
        <div className="flex flex-col">
          <span className="text-slate-200">{resolveCategoryValue(empresa.category, categorias) || "Sin categoría"}</span>
          <span className="text-xs text-slate-500">{empresa.phone || "Sin teléfono"}</span>
        </div>,
        <button
          type="button"
          onClick={openEditModal}
          className="text-left text-xs font-bold text-cyan-400 transition hover:text-cyan-300"
        >
          Editar
        </button>,
      ]]
    : [];

  if (!canManage) {
    return (
      <SectionCard title="Mi empresa" subtitle="Este módulo es exclusivo para administradores de empresa.">
        <div className="rounded-3xl border border-rose-400/20 bg-rose-400/10 px-4 py-6 text-sm font-medium text-rose-200">
          No tienes permisos para gestionar la información comercial de una empresa.
        </div>
      </SectionCard>
    );
  }

  return (
    <>
      <SectionCard
        title="Mi empresa"
        subtitle="Administra la ficha comercial de tu negocio. Esta información se usa para identificar y operar tus cupones."
        actionVisible={Boolean(empresa) || canCreate}
        action={
          <button
            type="button"
            onClick={empresa ? openEditModal : openCreateModal}
            className="btn-primary"
            disabled={actionDisabled}
          >
            {actionLabel}
          </button>
        }
      >
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            title="Empresa vinculada"
            value={loading ? "-" : empresa ? "Sí" : "No"}
            accent={empresa ? "text-emerald-400" : "text-amber-300"}
            helper={empresa ? "Tu cuenta ya está asociada a una empresa." : "Aún no hay empresa registrada para tu cuenta."}
          />
          <StatCard
            title="Código actual"
            value={loading ? "-" : empresa?.code ?? "Pendiente"}
            accent="text-cyan-400"
            helper="El código se asigna automáticamente y es de solo lectura."
          />
          <StatCard
            title="Fecha de registro"
            value={loading ? "-" : formatDate(empresa?.created_at)}
            accent="text-amber-300"
            helper="Referencia visible para validar el registro de tu negocio."
          />
        </div>

        <div className="mt-8">
          {loading ? (
            <div className="py-12 text-center text-sm font-medium text-slate-500">
              Cargando la información de tu empresa...
            </div>
          ) : loadError ? (
            <div className="rounded-3xl border border-rose-400/20 bg-rose-400/10 px-4 py-6 text-sm font-medium text-rose-200">
              {loadError}
            </div>
          ) : empresa ? (
            <DataTable
              columns={["Empresa", "Código", "Contacto", "Categoría", "Acción"]}
              rows={rows}
            />
          ) : canCreate ? (
            <div className="rounded-3xl border border-dashed border-white/10 px-4 py-10 text-center">
              <p className="text-sm font-semibold text-white">
                Todavía no hay una empresa registrada para tu cuenta.
              </p>
              <p className="mt-2 text-sm text-slate-400">
                Completa el formulario para crear la ficha comercial de tu negocio y usarla en la gestión de cupones.
              </p>
              {categorias.length === 0 ? (
                <p className="mt-4 text-sm font-semibold text-amber-300">
                  No puedes continuar hasta que exista al menos una categoría disponible.
                </p>
              ) : null}
            </div>
          ) : (
            <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-10 text-center text-sm text-slate-400">
              Tu cuenta todavía no puede registrar una empresa desde este módulo.
            </div>
          )}
        </div>
      </SectionCard>

      <EmpresaModal
        isOpen={modalOpen}
        title={empresa ? "Editar Empresa" : "Nueva Empresa"}
        formData={formData}
        errors={errors}
        categories={categorias}
        isSubmitting={isSubmitting}
        isPreparingCode={isPreparingCode}
        onClose={closeModal}
        onSubmit={handleSubmit}
        onFieldChange={handleFieldChange}
        onPhoneChange={handlePhoneChange}
      />
    </>
  );
}
