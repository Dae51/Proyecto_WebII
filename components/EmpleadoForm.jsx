import React, { useState } from "react";

const EMPTY_FORM = {
  name: "",
  last_name: "",
  DUI: "",
  phone: "",
  email: "",
  address: "",
};

const DUI_PATTERN = /^\d{8}-\d$/;
const PHONE_PATTERN = /^\d{4}-\d{4}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeText(value) {
  return String(value ?? "").trim();
}

function formatDui(value) {
  const digits = String(value ?? "").replace(/\D/g, "").slice(0, 9);
  if (digits.length <= 8) return digits;
  return `${digits.slice(0, 8)}-${digits.slice(8, 9)}`;
}

function formatPhone(value) {
  const digits = String(value ?? "").replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 4) return digits;
  return `${digits.slice(0, 4)}-${digits.slice(4)}`;
}

function getInitialFormValues(initialValues) {
  return {
    name: initialValues?.name ?? "",
    last_name: initialValues?.last_name ?? "",
    DUI: initialValues?.DUI ?? "",
    phone: initialValues?.phone ?? "",
    email: initialValues?.email ?? "",
    address: initialValues?.address ?? "",
  };
}

function validateForm(values) {
  const nextErrors = {};

  if (normalizeText(values.name).length < 2) {
    nextErrors.name = "Name must have at least 2 characters.";
  }

  if (normalizeText(values.last_name).length < 2) {
    nextErrors.last_name = "Last name must have at least 2 characters.";
  }

  if (!DUI_PATTERN.test(normalizeText(values.DUI))) {
    nextErrors.DUI = "DUI must use the format ########-#.";
  }

  if (!PHONE_PATTERN.test(formatPhone(values.phone))) {
    nextErrors.phone = "Phone must contain exactly 8 digits.";
  }

  if (!EMAIL_PATTERN.test(normalizeText(values.email).toLowerCase())) {
    nextErrors.email = "Please enter a valid email address.";
  }

  if (normalizeText(values.address).length > 255) {
    nextErrors.address = "Address must be 255 characters or fewer.";
  }

  return nextErrors;
}

export default function EmpleadoForm({
  isOpen = false,
  title = "Empleado",
  mode = "create",
  initialValues = EMPTY_FORM,
  saving = false,
  submitError = "",
  onSubmit,
  onCancel,
}) {
  const [formValues, setFormValues] = useState(() => getInitialFormValues(initialValues));
  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    const nextValue =
      field === "DUI"
        ? formatDui(value)
        : field === "phone"
          ? formatPhone(value)
          : value;

    setFormValues((previous) => ({
      ...previous,
      [field]: nextValue,
    }));

    if (errors[field]) {
      setErrors((previous) => ({
        ...previous,
        [field]: "",
      }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = validateForm(formValues);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    await onSubmit?.({
      ...formValues,
      name: normalizeText(formValues.name),
      last_name: normalizeText(formValues.last_name),
      DUI: formatDui(formValues.DUI),
      phone: formatPhone(formValues.phone),
      email: normalizeText(formValues.email).toLowerCase(),
      address: normalizeText(formValues.address),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-sm">
      <div className="custom-scroll relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[28px] border border-white/10 bg-[#07142f] p-6 shadow-2xl md:p-8">
        <div className="mb-6">
          <h3 className="text-2xl font-black text-white">{title}</h3>
          <p className="mt-2 text-sm text-slate-400">
            Completa los datos del empleado. La empresa se asigna automáticamente según tu sesión.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="bo-label">Nombre</label>
              <input
                type="text"
                value={formValues.name}
                onChange={(event) => handleChange("name", event.target.value)}
                className={errors.name ? "bo-input-error" : "bo-input"}
                placeholder="Nombre del empleado"
                disabled={saving}
              />
              {errors.name ? <span className="text-xs font-semibold text-rose-400">{errors.name}</span> : null}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="bo-label">Apellido</label>
              <input
                type="text"
                value={formValues.last_name}
                onChange={(event) => handleChange("last_name", event.target.value)}
                className={errors.last_name ? "bo-input-error" : "bo-input"}
                placeholder="Apellido del empleado"
                disabled={saving}
              />
              {errors.last_name ? <span className="text-xs font-semibold text-rose-400">{errors.last_name}</span> : null}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="bo-label">DUI</label>
              <input
                type="text"
                inputMode="numeric"
                value={formValues.DUI}
                onChange={(event) => handleChange("DUI", event.target.value)}
                className={errors.DUI ? "bo-input-error font-mono" : "bo-input font-mono"}
                placeholder="12345678-9"
                disabled={saving}
              />
              {errors.DUI ? <span className="text-xs font-semibold text-rose-400">{errors.DUI}</span> : null}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="bo-label">Teléfono</label>
              <input
                type="text"
                inputMode="numeric"
                value={formValues.phone}
                onChange={(event) => handleChange("phone", event.target.value)}
                className={errors.phone ? "bo-input-error font-mono" : "bo-input font-mono"}
                placeholder="7123-4567"
                disabled={saving}
              />
              {errors.phone ? <span className="text-xs font-semibold text-rose-400">{errors.phone}</span> : null}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="bo-label">Correo electrónico</label>
            <input
              type="email"
              value={formValues.email}
              onChange={(event) => handleChange("email", event.target.value)}
              className={errors.email ? "bo-input-error" : "bo-input"}
              placeholder="empleado@empresa.com"
              disabled={saving}
            />
            {errors.email ? <span className="text-xs font-semibold text-rose-400">{errors.email}</span> : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="bo-label">Dirección</label>
            <textarea
              rows={3}
              value={formValues.address}
              onChange={(event) => handleChange("address", event.target.value)}
              className={errors.address ? "bo-input-error" : "bo-input"}
              placeholder="Dirección del empleado"
              disabled={saving}
            />
            {errors.address ? <span className="text-xs font-semibold text-rose-400">{errors.address}</span> : null}
          </div>

          {submitError ? (
            <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm font-medium text-rose-200">
              {submitError}
            </div>
          ) : null}

          <div className="flex justify-end gap-3 border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary"
              disabled={saving}
            >
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Guardando..." : mode === "edit" ? "Actualizar empleado" : "Crear empleado"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
