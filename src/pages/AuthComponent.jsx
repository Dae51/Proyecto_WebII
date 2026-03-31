// Se importan React y sus hooks, así como funciones de navegación y notificaciones
import React, { useEffect, useRef, useState } from "react";
// Se importan funciones de autenticación y validación
import { useNavigate } from "react-router-dom";
// Se la funcion de notificaciones
import { toast } from "react-toastify";
// Se importan funciones de autenticación 
import {
  getCurrentSession,
  loginWithPassword,
  registerWithPassword,
  subscribeToAuthChanges,
} from "../resources/AuthService";
// Se importan funciones de validación
import {
  USER_ROLES,
  getDefaultRouteByRole,
} from "../resources/roles";
import {
  validateLoginInput,
  validateRegisterInput,
} from "../resources/validator";
// Se definen constantes para los modos de autenticación y el estado inicial del formulario
const MODE = {
  LOGIN: "login",
  SIGNUP: "signup",
};
// Estado inicial para errores y éxito
const INITIAL_STATUS = { error: "", success: "" };
const INITIAL_FORM = {
  email: "",
  password: "",
  name: "",
  lastName: "",
  address: "",
  phone: "",
  dui: "",
  confirmPassword: "",
};
// Clase común para los campos de entrada
const INPUT_CLASS =
  "w-full px-4 py-2.5 border-2 border-gray-100 rounded-xl text-sm bg-gray-50 focus:outline-none focus:border-teal-400 focus:bg-white transition-all";

function formatWithPattern(rawValue, firstBlockLength, maxDigits) {
  const onlyDigits = String(rawValue ?? "").replace(/\D/g, "").slice(0, maxDigits);
  if (onlyDigits.length <= firstBlockLength) return onlyDigits;
  return `${onlyDigits.slice(0, firstBlockLength)}-${onlyDigits.slice(firstBlockLength)}`;
}

  // Componente principal de autenticación
export default function AuthComponent() {
  // Se declara la constante modo
  const [mode, setMode] = useState(MODE.LOGIN);
  // Se declara el estado para errores
  const [status, setStatus] = useState(INITIAL_STATUS);
  // Se declara el estado para el formulario
  const [submitting, setSubmitting] = useState(false);
  // Se declara el estado para mostrar/ocultar contraseña
  const [showPassword, setShowPassword] = useState(false);
  // Se declara el forms
  const [form, setForm] = useState(INITIAL_FORM);
  // Se declara la función de navegación
  const navigate = useNavigate();
  // Se declara una referencia para verificar si el componente está montado
  const isMountedRef = useRef(true);
  // Se declara una constante para verificar si el modo actual es de registro
  const isSignup = mode === MODE.SIGNUP;

  // Función para limpiar el estado de errores y éxito
  const clearStatus = () => setStatus(INITIAL_STATUS);

  // Se utiliza useEffect para manejar la lógica de sesión y suscripción a cambios de autenticación
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Se verifica la sesión actual al montar el componente y se suscribe a cambios de autenticación
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
        navigate(getDefaultRouteByRole(session.app_role), { replace: true });
      }
    };

    checkSession();

    const subscription = subscribeToAuthChanges((event, session) => {
      if (!isMountedRef.current) return;

      if (event === "SIGNED_IN" && session) {
        navigate(getDefaultRouteByRole(session.app_role), { replace: true });
      }
    });

    return () => subscription?.unsubscribe?.();
  }, [navigate]);

  // Función para manejar cambios en los campos del formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    let nextValue = value;

    if (name === "phone") {
      nextValue = formatWithPattern(value, 4, 8);
    } else if (name === "dui") {
      nextValue = formatWithPattern(value, 8, 9);
    }

    setForm((prev) => ({ ...prev, [name]: nextValue }));
    setStatus((prev) => (prev.error || prev.success ? INITIAL_STATUS : prev));
  };

// Función para manejar el envío del formulario, validando los datos y llamando a las funciones de autenticación correspondientes
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
            address: form.address,
            phone: form.phone,
            dui: form.dui,
          });
    if (validationError) {
      toast.info(validationError);
      setStatus({ error: validationError, success: "" });
      return;
    }

    setSubmitting(true);

    try {
      if (mode === MODE.LOGIN) {
        const { data, error } = await loginWithPassword({
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
        navigate(getDefaultRouteByRole(data?.session?.app_role), { replace: true });
        return;
      }

      const { data, error } = await registerWithPassword({
        email: form.email,
        password: form.password,
        name: form.name,
        lastName: form.lastName,
        address: form.address,
        phone: form.phone,
        dui: form.dui,
        role: USER_ROLES.CLIENT,
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
        navigate(getDefaultRouteByRole(data?.session?.app_role), { replace: true });
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

  // Función para cambiar entre modos de autenticación (login/signup)
  const switchMode = (nextMode) => {
    if (nextMode === mode) return;
    setMode(nextMode);
    clearStatus();
    setShowPassword(false);
    setForm(INITIAL_FORM);
  };

  // Renderizado del componente con formularios para login y registro, incluyendo validaciones, mensajes de error/éxito y navegación
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

            {isSignup && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Dirección</label>
                  <input
                    type="text"
                    name="address"
                    placeholder="San Salvador, colonia..."
                    value={form.address}
                    onChange={handleChange}
                    autoComplete="street-address"
                    required
                    className={INPUT_CLASS}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Teléfono</label>
                    <input
                      type="text"
                      name="phone"
                      placeholder="1234-5678"
                      pattern="\d{4}-\d{4}"
                      title="Formato requerido: 1234-5678"
                      value={form.phone}
                      onChange={handleChange}
                      inputMode="numeric"
                      maxLength={9}
                      autoComplete="tel"
                      required
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">DUI</label>
                    <input
                      type="text"
                      name="dui"
                      placeholder="12345678-9"
                      pattern="\d{8}-\d"
                      title="Formato requerido: 12345678-9"
                      value={form.dui}
                      onChange={handleChange}
                      inputMode="numeric"
                      maxLength={10}
                      required
                      className={INPUT_CLASS}
                    />
                  </div>
                </div>
              </>
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
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder={isSignup ? "Mínimo 8 caracteres" : "••••••••"}
                  value={form.password}
                  onChange={handleChange}
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  required
                  className={`${INPUT_CLASS} pr-20`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? "Ocultar" : "Mostrar"}
                </button>
              </div>
              {mode === MODE.LOGIN && (
                <div className="text-right mt-1">
                  <button
                    type="button"
                    onClick={() => navigate("/forgot-password")}
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
