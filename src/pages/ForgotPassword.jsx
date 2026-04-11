// Se importa reac y useState
import React, { useState } from "react";
// Se importan el objeto toast de react-toastify para mostrar notificaciones
import { toast } from "react-toastify";
// Se importan las funciones necesarias para solicitar la recuperación de contraseña y validar el correo
import {
  requestPasswordRecovery,
} from "../resources/AuthService";
// Se importa la función para validar el correo de recuperación
import { validateRecoveryEmailInput } from "../resources/validator";

// Netlify/production redirect for recovery flow
const IS_PRODUCTION_NETLIFY = typeof window !== "undefined" && window.location.origin.includes("netlify.app");
const REDIRECT_TO_RECOVERY = IS_PRODUCTION_NETLIFY
  ? "https://lacuponerawebii.netlify.app/restore-password"
  : `${window.location.origin}/restore-password`;

// Componente para solicitar el correo de recuperación
function StepRequestEmail({ onBack }) {
  // Se declara el correo
  const [email, setEmail] = useState("");
  // Se declaran estados para manejar la carga, el envío exitoso y los errores
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  // Se declara un estado para manejar errores
  const [error, setError] = useState("");

  // Función para manejar el envío del formulario de recuperación de contraseña
  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateRecoveryEmailInput(email);
    if (validationError) {
      toast.info(validationError);
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");

    const { error } = await requestPasswordRecovery({
      email,
      redirectTo: REDIRECT_TO_RECOVERY,
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
      setError(error.message);
    } else {
      toast.success("Enlace de recuperacion enviado. Revisa tu correo.");
      setSent(true);
    }
  };

  // Si el enlace de recuperación fue enviado exitosamente, se muestra un mensaje de éxito y opciones para reenviar el correo o volver al login
  if (sent) {
    return (
      <div className="text-center">
        {/* Icono éxito */}
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ backgroundColor: "#e6f7f8" }}
        >
          <svg className="w-8 h-8" style={{ color: "#0097a7" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-black mb-2" style={{ color: "#1a2580" }}>
          ¡Revisa tu correo!
        </h2>
        <p className="text-sm text-gray-400 mb-1">
          Enviamos un enlace de recuperación a
        </p>
        <p className="text-sm font-bold mb-6" style={{ color: "#0097a7" }}>{email}</p>
        <p className="text-xs text-gray-400 mb-6">
          Si no lo ves en tu bandeja de entrada, revisa tu carpeta de spam.
        </p>
        <button
          onClick={() => { setSent(false); setEmail(""); }}
          className="text-xs font-semibold underline text-gray-400 hover:text-gray-600 transition-colors"
        >
          ¿No llegó? Reenviar correo
        </button>
      </div>
    );
  }

  // Renderizado del formulario para solicitar el correo de recuperación, incluyendo validaciones, mensajes de error y navegación
  return (
    <>
      {/* Icono candado */}
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
        style={{ backgroundColor: "#fff7e6" }}
      >
        <svg className="w-8 h-8" style={{ color: "#f5a623" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>


      <p className="text-sm text-gray-400 text-center mb-7">
        Ingresa tu correo y te enviaremos un enlace para restablecerla.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">
            Correo electrónico
          </label>
          <input
            type="email"
            placeholder="tucorreo@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2.5 border-2 border-gray-100 rounded-xl text-sm bg-gray-50 focus:outline-none focus:border-teal-400 focus:bg-white transition-all"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
            <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-red-500">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl font-black text-sm text-gray-900 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          style={{ backgroundColor: "#f5a623", boxShadow: "0 4px 15px rgba(245,166,35,0.4)" }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Enviando...
            </span>
          ) : (
            "Enviar enlace de recuperación →"
          )}
        </button>
      </form>

      <p className="text-center text-xs text-gray-400 mt-5">
        ¿Recordaste tu contraseña?{" "}
        <button onClick={onBack} className="font-bold underline" style={{ color: "#1a2580" }}>
          Volver al login
        </button>
      </p>
    </>
  );
}

// Componente principal de la página de recuperación de contraseña, que incluye el formulario para solicitar el correo de recuperación y navegación para volver al login
export default function ForgotPassword({ onBack }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--app-bg-color)" }}>
      {/* Body */}
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
          {/* Badge */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 border border-yellow-400 bg-yellow-50 rounded-full px-3 py-1">
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              <span className="text-xs font-bold text-yellow-700">Recuperación de cuenta</span>
            </div>
          </div>

          <StepRequestEmail onBack={onBack || (() => window.history.back())} />
        </div>
      </div>
    </div>
  );
}
