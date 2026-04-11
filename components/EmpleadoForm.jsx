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
const PHONE_PATTERN = /^\d{8}$/;
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
  return String(value ?? "").replace(/\D/g, "").slice(0, 8);
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
  mode = "create",
  initialValues = EMPTY_FORM,
  saving = false,
  onSubmit,
  onCancel,
}) {
  const [formValues, setFormValues] = useState(() => getInitialFormValues(initialValues));
  const [errors, setErrors] = useState({});

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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="bo-label">Name</label>
          <input
            type="text"
            value={formValues.name}
            onChange={(event) => handleChange("name", event.target.value)}
            className={errors.name ? "bo-input-error" : "bo-input"}
            placeholder="Employee first name"
            disabled={saving}
          />
          {errors.name ? <span className="text-xs font-semibold text-rose-400">{errors.name}</span> : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="bo-label">Last name</label>
          <input
            type="text"
            value={formValues.last_name}
            onChange={(event) => handleChange("last_name", event.target.value)}
            className={errors.last_name ? "bo-input-error" : "bo-input"}
            placeholder="Employee last name"
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
            value={formValues.DUI}
            onChange={(event) => handleChange("DUI", event.target.value)}
            className={errors.DUI ? "bo-input-error font-mono" : "bo-input font-mono"}
            placeholder="12345678-9"
            disabled={saving}
          />
          {errors.DUI ? <span className="text-xs font-semibold text-rose-400">{errors.DUI}</span> : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="bo-label">Phone</label>
          <input
            type="text"
            value={formValues.phone}
            onChange={(event) => handleChange("phone", event.target.value)}
            className={errors.phone ? "bo-input-error font-mono" : "bo-input font-mono"}
            placeholder="77778888"
            disabled={saving}
          />
          {errors.phone ? <span className="text-xs font-semibold text-rose-400">{errors.phone}</span> : null}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="bo-label">Email</label>
        <input
          type="email"
          value={formValues.email}
          onChange={(event) => handleChange("email", event.target.value)}
          className={errors.email ? "bo-input-error" : "bo-input"}
          placeholder="employee@company.com"
          disabled={saving}
        />
        {errors.email ? <span className="text-xs font-semibold text-rose-400">{errors.email}</span> : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="bo-label">Address</label>
        <textarea
          rows={3}
          value={formValues.address}
          onChange={(event) => handleChange("address", event.target.value)}
          className={errors.address ? "bo-input-error" : "bo-input"}
          placeholder="Optional address"
          disabled={saving}
        />
        {errors.address ? <span className="text-xs font-semibold text-rose-400">{errors.address}</span> : null}
      </div>

      <div className="flex justify-end gap-3 border-t border-white/10 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary"
          disabled={saving}
        >
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Saving..." : mode === "edit" ? "Update employee" : "Create employee"}
        </button>
      </div>
    </form>
  );
}
