import React, { useEffect, useMemo, useRef, useState } from "react";

const INITIAL_FORM = {
  cardholderName: "",
  cardNumber: "",
  expirationDate: "",
  cvv: "",
};

const INITIAL_TOUCHED = {
  cardholderName: false,
  cardNumber: false,
  expirationDate: false,
  cvv: false,
};

function getCardDigits(value) {
  return String(value ?? "").replace(/\D/g, "").slice(0, 19);
}

function formatCardNumber(value) {
  const digits = getCardDigits(value);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function formatExpirationDate(value) {
  const digits = String(value ?? "").replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function formatCvv(value) {
  return String(value ?? "").replace(/\D/g, "").slice(0, 4);
}

function validatePaymentForm(form) {
  const errors = {};
  const name = String(form.cardholderName ?? "").trim();
  const cardDigits = getCardDigits(form.cardNumber);
  const expiration = String(form.expirationDate ?? "").trim();
  const cvv = String(form.cvv ?? "").trim();

  if (!name) {
    errors.cardholderName = "El nombre en la tarjeta es obligatorio.";
  }

  if (!cardDigits) {
    errors.cardNumber = "El número de tarjeta es obligatorio.";
  } else if (cardDigits.length < 16) {
    errors.cardNumber = "El número de tarjeta debe tener al menos 16 dígitos.";
  }

  if (!expiration) {
    errors.expirationDate = "La fecha de vencimiento es obligatoria.";
  } else if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiration)) {
    errors.expirationDate = "Ingresa una fecha válida con formato MM/AA.";
  }

  if (!cvv) {
    errors.cvv = "El CVV es obligatorio.";
  } else if (!/^\d{3,4}$/.test(cvv)) {
    errors.cvv = "El CVV debe tener 3 o 4 dígitos.";
  }

  return errors;
}

function FormField({
  id,
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  type = "text",
  inputMode,
  autoComplete,
  maxLength,
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        inputMode={inputMode}
        autoComplete={autoComplete}
        maxLength={maxLength}
        className={`w-full rounded-xl border px-3 py-2.5 text-sm text-slate-900 outline-none transition ${
          error
            ? "border-red-300 bg-red-50/60 focus:border-red-400"
            : "border-slate-200 bg-slate-50 focus:border-emerald-500 focus:bg-white"
        }`}
      />
      {error ? (
        <p className="mt-1.5 text-xs text-red-600" aria-live="polite">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export default function PaymentModal({
  isOpen,
  total,
  isSubmitting = false,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [touched, setTouched] = useState(INITIAL_TOUCHED);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const isMountedRef = useRef(true);

  const errors = useMemo(() => validatePaymentForm(form), [form]);
  const isFormValid = Object.keys(errors).length === 0;
  const isBusy = isSimulating || isSubmitting;

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
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

  function markFieldTouched(fieldName) {
    setTouched((prev) => ({ ...prev, [fieldName]: true }));
  }

  function handleChange(fieldName, nextValue) {
    const formatters = {
      cardNumber: formatCardNumber,
      expirationDate: formatExpirationDate,
      cvv: formatCvv,
    };

    const formatter = formatters[fieldName];
    const formattedValue = formatter ? formatter(nextValue) : nextValue;

    setForm((prev) => ({
      ...prev,
      [fieldName]: formattedValue,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (isBusy) return;

    setHasSubmitted(true);
    setTouched({
      cardholderName: true,
      cardNumber: true,
      expirationDate: true,
      cvv: true,
    });

    if (!isFormValid) {
      return;
    }

    setIsSimulating(true);

    try {
      await new Promise((resolve) => {
        window.setTimeout(resolve, 1500);
      });

      await onSubmit?.({
        ...form,
        cardholderName: form.cardholderName.trim(),
        cardNumber: getCardDigits(form.cardNumber),
      });
    } finally {
      if (isMountedRef.current) {
        setIsSimulating(false);
      }
    }
  }

  function handleBackdropClick(event) {
    if (event.target !== event.currentTarget || isBusy) return;
    onClose?.();
  }

  function getFieldError(fieldName) {
    return touched[fieldName] || hasSubmitted ? errors[fieldName] : "";
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
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-500">
              Pago seguro
            </p>
            <h2 className="mt-1 text-2xl font-extrabold text-slate-900">
              Simulación de pago
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Este es un formulario de pago simulado para fines académicos.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Cerrar modal de pago"
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

        <form onSubmit={handleSubmit} className="px-5 py-5 sm:px-6">
          <div className="mb-5 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
              Total a pagar
            </p>
            <p className="mt-1 text-3xl font-extrabold text-emerald-700">
              ${Number(total || 0).toFixed(2)}
            </p>
          </div>

          <div className="space-y-4">
            <FormField
              id="payment-cardholder-name"
              label="Nombre en la tarjeta"
              value={form.cardholderName}
              onChange={(event) => handleChange("cardholderName", event.target.value)}
              onBlur={() => markFieldTouched("cardholderName")}
              placeholder="Como aparece en la tarjeta"
              autoComplete="cc-name"
              error={getFieldError("cardholderName")}
            />

            <FormField
              id="payment-card-number"
              label="Número de tarjeta"
              value={form.cardNumber}
              onChange={(event) => handleChange("cardNumber", event.target.value)}
              onBlur={() => markFieldTouched("cardNumber")}
              placeholder="1234 5678 9012 3456"
              inputMode="numeric"
              autoComplete="cc-number"
              maxLength={23}
              error={getFieldError("cardNumber")}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                id="payment-expiration-date"
                label="Fecha de vencimiento"
                value={form.expirationDate}
                onChange={(event) => handleChange("expirationDate", event.target.value)}
                onBlur={() => markFieldTouched("expirationDate")}
                placeholder="MM/AA"
                inputMode="numeric"
                autoComplete="cc-exp"
                maxLength={5}
                error={getFieldError("expirationDate")}
              />

              <FormField
                id="payment-cvv"
                label="CVV"
                value={form.cvv}
                onChange={(event) => handleChange("cvv", event.target.value)}
                onBlur={() => markFieldTouched("cvv")}
                placeholder="123"
                inputMode="numeric"
                autoComplete="cc-csc"
                maxLength={4}
                error={getFieldError("cvv")}
              />
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isBusy}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={!isFormValid || isBusy}
              className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
            >
              {isBusy ? "Procesando pago..." : "Pagar ahora"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
