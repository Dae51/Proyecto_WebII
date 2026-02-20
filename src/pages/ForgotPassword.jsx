import React from "react";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { checkSupabaseConnection, supabase } from "../resources/supabaseClient";

function StepRequestEmail({ onBack }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const validateConnection = async () => {
      const { ok, error } = await checkSupabaseConnection();
      if (!ok) {
        toast.error("No se pudo conectar a Supabase.");
        console.error("Supabase NO conectado:", error?.message);
      } else {
        console.log("Supabase conectado OK");
      }
    };

    validateConnection();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");


    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/restore`,
      // 👆 Esta URL debe estar en tu lista de "Redirect URLs" en Supabase Dashboard
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

// ─────────────────────────────────────────────
// PASO 2 – Nueva contraseña (llegó por el link)
// Supabase redirige aquí con token en la URL
// ─────────────────────────────────────────────
function StepResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [show, setShow] = useState({ pw: false, cpw: false });

  // Supabase maneja el token automáticamente al detectar el hash en la URL
  // cuando usas onAuthStateChange con el evento PASSWORD_RECOVERY
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      // El evento PASSWORD_RECOVERY se dispara cuando Supabase
      // procesa el token del link de recuperación
      if (event === "PASSWORD_RECOVERY") {
        // La sesión ya está activa, el usuario puede cambiar su contraseña
        console.log("Sesión de recuperación activa");
      }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const validate = () => {
    if (password.length < 8) return "La contraseña debe tener al menos 8 caracteres.";
    if (password !== confirm) return "Las contraseñas no coinciden.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      toast.info(validationError);
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");

    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (error) {
      toast.error(error.message);
      setError(error.message);
    } else {
      toast.success("Contrasena actualizada correctamente.");
      setDone(true);
    }
  };

  const strength = () => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };

  const strengthLabel = ["", "Débil", "Regular", "Buena", "Fuerte"];
  const strengthColor = ["", "bg-red-400", "bg-yellow-400", "bg-blue-400", "bg-green-400"];
  const s = strength();

  if (done) {
    return (
      <div className="text-center">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ backgroundColor: "#e6f7f8" }}
        >
          <svg className="w-8 h-8" style={{ color: "#0097a7" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-black mb-2" style={{ color: "#1a2580" }}>
          ¡Contraseña actualizada!
        </h2>
        <p className="text-sm text-gray-400 mb-6">
          Tu contraseña fue restablecida correctamente. Ya puedes iniciar sesión.
        </p>
        <a
          className="inline-block w-full py-3 rounded-xl font-black text-sm text-gray-900 text-center transition-all hover:-translate-y-0.5"
          style={{ backgroundColor: "#f5a623", boxShadow: "0 4px 15px rgba(245,166,35,0.4)" }}
        >
          Ir al Login →
        </a>
      </div>
    );
  }

  return (
    <>
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
        style={{ backgroundColor: "#e8eaff" }}
      >
        <svg className="w-8 h-8" style={{ color: "#1a2580" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
      </div>

      <h2 className="text-2xl font-black mb-1 text-center" style={{ color: "#1a2580" }}>
        Nueva contraseña
      </h2>
      <p className="text-sm text-gray-400 text-center mb-7">
        Elige una contraseña segura para proteger tu cuenta.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Password field */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Nueva contraseña</label>
          <div className="relative">
            <input
              type={show.pw ? "text" : "password"}
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              required
              className="w-full px-4 py-2.5 pr-10 border-2 border-gray-100 rounded-xl text-sm bg-gray-50 focus:outline-none focus:border-teal-400 focus:bg-white transition-all"
            />
            <button
              type="button"
              onClick={() => setShow((s) => ({ ...s, pw: !s.pw }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {show.pw ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>

          {/* Strength bar */}
          {password && (
            <div className="mt-2">
              <div className="flex gap-1 mb-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= s ? strengthColor[s] : "bg-gray-200"}`}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-400">
                Seguridad: <span className="font-semibold">{strengthLabel[s]}</span>
              </p>
            </div>
          )}
        </div>

        {/* Confirm password */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Confirmar contraseña</label>
          <div className="relative">
            <input
              type={show.cpw ? "text" : "password"}
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => { setConfirm(e.target.value); setError(""); }}
              required
              className="w-full px-4 py-2.5 pr-10 border-2 border-gray-100 rounded-xl text-sm bg-gray-50 focus:outline-none focus:border-teal-400 focus:bg-white transition-all"
            />
            <button
              type="button"
              onClick={() => setShow((s) => ({ ...s, cpw: !s.cpw }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {show.cpw ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>

          {/* Match indicator */}
          {confirm && (
            <p className={`text-xs mt-1 font-semibold ${password === confirm ? "text-green-500" : "text-red-400"}`}>
              {password === confirm ? "✓ Las contraseñas coinciden" : "✗ Las contraseñas no coinciden"}
            </p>
          )}
        </div>

        {/* Error */}
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
          className="w-full py-3 rounded-xl font-black text-sm text-white transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ backgroundColor: "#1a2580", boxShadow: "0 4px 15px rgba(26,37,128,0.4)" }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Actualizando...
            </span>
          ) : (
            "Actualizar contraseña →"
          )}
        </button>
      </form>
    </>
  );
}


export default function ForgotPassword({ onBack }) {
  // Supabase añade #access_token=... al redirigir desde el email.
  // Si existe en la URL, mostramos el paso de nueva contraseña.
  const isResetFlow = window.location.hash.includes("access_token") ||
    window.location.hash.includes("type=recovery");

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#1a2580" }}>

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

          {isResetFlow
            ? <StepResetPassword />
            : <StepRequestEmail onBack={onBack || (() => window.history.back())} />
          }

        </div>
      </div>
    </div>
  );
}
