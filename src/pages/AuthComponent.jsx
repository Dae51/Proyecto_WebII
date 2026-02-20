import React from "react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getCurrentSession,
  loginWithPassword,
  registerWithPassword,
  subscribeToAuthChanges,
  validateLoginInput,
  validateRegisterInput,
} from "../resources/AuthService";

const MODE = {
  LOGIN: "login",
  SIGNUP: "signup",
};

const INITIAL_STATUS = { error: "", success: "" };
const INITIAL_FORM = {
  email: "",
  password: "",
  name: "",
  lastName: "",
  confirmPassword: "",
};

const INPUT_CLASS =
  "w-full px-4 py-2.5 border-2 border-gray-100 rounded-xl text-sm bg-gray-50 focus:outline-none focus:border-teal-400 focus:bg-white transition-all";

export default function AuthComponent() {
  const [mode, setMode] = useState(MODE.LOGIN);
  const [status, setStatus] = useState(INITIAL_STATUS);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const navigate = useNavigate();
  const isMountedRef = useRef(true);
  const isSignup = mode === MODE.SIGNUP;

  const clearStatus = () => setStatus(INITIAL_STATUS);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      const { session, error } = await getCurrentSession();

      if (!isMountedRef.current) return;

      if (error) {
        toast.error(`Error de sesion: ${error.message}`);
        setStatus({ error: error.message, success: "" });
        return;
      }

      if (session) {
        navigate("/", { replace: true });
      }
    };

    checkSession();

    const subscription = subscribeToAuthChanges((event, session) => {
      if (!isMountedRef.current) return;

      if (event === "SIGNED_IN" && session) {
        navigate("/", { replace: true });
      }
    });

    return () => subscription?.unsubscribe?.();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setStatus((prev) => (prev.error || prev.success ? INITIAL_STATUS : prev));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    clearStatus();

    const validationError =
      mode === MODE.LOGIN
        ? validateLoginInput({ email: form.email, password: form.password })
        : validateRegisterInput({
            email: form.email,
            password: form.password,
            confirmPassword: form.confirmPassword,
            name: form.name,
            lastName: form.lastName,
          });
    if (validationError) {
      toast.info(validationError);
      setStatus({ error: validationError, success: "" });
      return;
    }

    setSubmitting(true);

    try {
      if (mode === MODE.LOGIN) {
        const { error } = await loginWithPassword({
          email: form.email,
          password: form.password,
        });

        if (error) {
          toast.error(error.message);
          setStatus({ error: error.message, success: "" });
          return;
        }

        toast.success("Inicio de sesion exitoso.");
        setStatus({ error: "", success: "Inicio de sesión exitoso." });
        navigate("/", { replace: true });
        return;
      }

      const { data, error } = await registerWithPassword({
        email: form.email,
        password: form.password,
        name: form.name,
        lastName: form.lastName,
        emailRedirectTo: `${window.location.origin}/auth`,
      });

      if (error) {
        toast.error(error.message);
        setStatus({ error: error.message, success: "" });
        return;
      }

      if (data?.session) {
        toast.success("Cuenta creada e inicio de sesion exitoso.");
        setStatus({ error: "", success: "Cuenta creada e inicio de sesión exitoso." });
        navigate("/", { replace: true });
        return;
      }

      toast.success("Cuenta creada. Revisa tu correo para confirmar la cuenta.");
      setStatus({
        error: "",
        success: "Cuenta creada. Revisa tu correo para confirmar la cuenta.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error inesperado.";
      toast.error(message);
      setStatus({ error: message, success: "" });
    } finally {
      if (isMountedRef.current) {
        setSubmitting(false);
      }
    }
  };

  const switchMode = (nextMode) => {
    if (nextMode === mode) return;
    setMode(nextMode);
    clearStatus();
    setForm(INITIAL_FORM);
  };

  return (
    <>
      {/* Body */}
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
          {/* Tabs */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-7">
            {[MODE.LOGIN, MODE.SIGNUP].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => switchMode(tab)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  mode === tab ? "bg-white shadow text-blue-900" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {tab === "login" ? "Iniciar Sesión" : "Registrarse"}
              </button>
            ))}
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 border border-yellow-400 bg-yellow-50 rounded-full px-3 py-1 mb-4">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            <span className="text-xs font-bold text-yellow-700">
              {mode === MODE.LOGIN ? "Ofertas activas ahora mismo" : "¡Registro gratuito!"}
            </span>
          </div>

          <h2 className="text-2xl font-black mb-1" style={{ color: "#1a2580" }}>
            {mode === MODE.LOGIN ? "¡Bienvenido!" : "Crea tu cuenta"}
          </h2>
          <p className="text-sm text-gray-400 mb-6">
            {mode === MODE.LOGIN ? (
              <>
                Accede a <span className="text-yellow-500 font-bold">descuentos exclusivos</span> en tu ciudad.
              </>
            ) : (
              <>
                Únete y ahorra con <span className="text-yellow-500 font-bold">ofertas increíbles</span> cada día.
              </>
            )}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Sign up only: Name row */}
            {isSignup && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Nombre</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Juan"
                    value={form.name}
                    onChange={handleChange}
                    autoComplete="given-name"
                    required
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Apellido</label>
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Pérez"
                    value={form.lastName}
                    onChange={handleChange}
                    autoComplete="family-name"
                    required
                    className={INPUT_CLASS}
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Correo electrónico</label>
              <input
                type="email"
                name="email"
                placeholder="tucorreo@ejemplo.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                required
                className={INPUT_CLASS}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Contraseña</label>
              <input
                type="password"
                name="password"
                placeholder={isSignup ? "Mínimo 8 caracteres" : "••••••••"}
                value={form.password}
                onChange={handleChange}
                autoComplete={isSignup ? "new-password" : "current-password"}
                required
                className={INPUT_CLASS}
              />
              {mode === MODE.LOGIN && (
                <div className="text-right mt-1">
                  <button
                    type="button"
                    onClick={() => navigate("/restore")}
                    className="text-xs font-semibold text-teal-500 hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              )}
            </div>

            {/* Sign up only: Confirm password */}
            {isSignup && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Confirmar contraseña</label>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="••••••••"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  required
                  className={INPUT_CLASS}
                />
              </div>
            )}

            {status.error && (
              <p
                className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-xl px-3 py-2"
                aria-live="polite"
              >
                {status.error}
              </p>
            )}
            {status.success && (
              <p
                className="text-xs text-green-600 bg-green-50 border border-green-200 rounded-xl px-3 py-2"
                aria-live="polite"
              >
                {status.success}
              </p>
            )}

            {/* Terms (signup) */}
            {isSignup && (
              <p className="text-center text-xs text-gray-400">
                Al registrarte aceptas nuestros{" "}
                <a href="#" className="text-teal-500 font-semibold hover:underline">
                  Términos de uso
                </a>{" "}
                y{" "}
                <a href="#" className="text-teal-500 font-semibold hover:underline">
                  Política de privacidad
                </a>
                .
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl font-black text-sm transition-all hover:-translate-y-0.5 active:translate-y-0"
              style={
                mode === MODE.LOGIN
                  ? {
                      backgroundColor: "#f5a623",
                      color: "#111",
                      boxShadow: "0 4px 15px rgba(245,166,35,0.4)",
                    }
                  : {
                      backgroundColor: "#1a2580",
                      color: "white",
                      boxShadow: "0 4px 15px rgba(26,37,128,0.4)",
                    }
              }
            >
              {submitting
                ? "Procesando..."
                : mode === MODE.LOGIN
                  ? "Iniciar Sesión →"
                  : "Crear cuenta gratis →"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
