// Se importa React y los hooks necesarios para manejar el estado y la navegación
import React, { useMemo, useState } from "react";
// Se importa useNavigate para redirigir al usuario después de restablecer la contraseña
import { useNavigate } from "react-router-dom";
// Se importa el objeto toast de react-toastify para mostrar notificaciones
import { toast } from "react-toastify";
// Se importa la función para actualizar la contraseña y validar los campos de entrada
import { updatePassword } from "../resources/AuthService";
// Se importa la función para validar los campos de entrada del formulario de restablecimiento de contraseña
import { validatePasswordResetInput } from "../resources/validator";

// Componente principal de la página de recuperación de contraseña
export default function RestorePassword() {
  // Se declara el hook useNavigate para redirigir al usuario después de restablecer la contraseña
  const navigate = useNavigate();
  // Se declaran el campo de contraseña
  const [password, setPassword] = useState("");
  // Se declara un estado para manejar la confirmación de la contraseña
  const [confirmPassword, setConfirmPassword] = useState("");
  // Se declaran estados para manejar la visibilidad de las contraseñas
  const [showPassword, setShowPassword] = useState(false);
  // Se declara un estado para manejar la visibilidad de la confirmación de contraseña
  const [showConfirm, setShowConfirm] = useState(false);
  // Se declara un estado para manejar la carga
  const [loading, setLoading] = useState(false);
  // Se declara un estado para manejar el éxito del restablecimiento de contraseña
  const [done, setDone] = useState(false);
  // Se declara un estado para manejar errores
  const [error, setError] = useState("");

  // Se utiliza useMemo para verificar si el enlace de recuperación es válido, buscando tokens específicos en la URL
  const hasRecoveryToken = useMemo(
    () =>
      window.location.hash.includes("access_token") ||
      window.location.hash.includes("type=recovery"),
    []
  );

  // Se utiliza useMemo para calcular la fortaleza de la contraseña ingresada,
  const strength = useMemo(() => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  }, [password]);

  const strengthLabel = ["", "Débil", "Regular", "Buena", "Fuerte"];
  const strengthColor = ["", "bg-red-400", "bg-yellow-400", "bg-blue-400", "bg-green-400"];

  // Función para manejar el envío del formulario de restablecimiento de contraseña
  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validatePasswordResetInput({ password, confirmPassword });
    if (validationError) {
      toast.info(validationError);
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");

    const { error } = await updatePassword(password);

    setLoading(false);

    if (error) {
      toast.error(error.message);
      setError(error.message);
      return;
    }

    toast.success("Contraseña actualizada correctamente.");
    setDone(true);
  };

  // Renderizado de la página de restablecimiento de contraseña, incluyendo validaciones, mensajes de error y navegación para volver al login
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--app-bg-color)" }}>
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 border border-yellow-400 bg-yellow-50 rounded-full px-3 py-1">
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              <span className="text-xs font-bold text-yellow-700">Restablecer contraseña</span>
            </div>
          </div>

          {!hasRecoveryToken && !done && (
            <div className="mb-5 rounded-xl border border-yellow-300 bg-yellow-50 px-4 py-3">
              <p className="text-xs text-yellow-800">
                El enlace de recuperación no parece válido o ya expiró. Solicita uno nuevo.
              </p>
              <button
                type="button"
                className="mt-2 text-xs font-semibold underline"
                style={{ color: "#1a2580" }}
                onClick={() => navigate("/forgot-password", { replace: true })}
              >
                Solicitar nuevo enlace
              </button>
            </div>
          )}

          {done ? (
            <div className="text-center">
              <h2 className="text-2xl font-black mb-2" style={{ color: "#1a2580" }}>
                ¡Contraseña actualizada!
              </h2>
              <p className="text-sm text-gray-400 mb-6">
                Tu contraseña fue restablecida. Ya puedes iniciar sesión.
              </p>
              <button
                type="button"
                onClick={() => navigate("/auth", { replace: true })}
                className="w-full py-3 rounded-xl font-black text-sm text-gray-900 transition-all hover:-translate-y-0.5"
                style={{ backgroundColor: "#f5a623", boxShadow: "0 4px 15px rgba(245,166,35,0.4)" }}
              >
                Ir al Login →
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-black mb-2 text-center" style={{ color: "#1a2580" }}>
                Nueva contraseña
              </h2>
              <p className="text-sm text-gray-400 text-center mb-6">
                Elige una contraseña segura para tu cuenta.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Nueva contraseña</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (error) setError("");
                      }}
                      placeholder="Mínimo 8 caracteres"
                      autoComplete="new-password"
                      required
                      className="w-full px-4 py-2.5 pr-10 border-2 border-gray-100 rounded-xl text-sm bg-gray-50 focus:outline-none focus:border-teal-400 focus:bg-white transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500"
                    >
                      {showPassword ? "Ocultar" : "Mostrar"}
                    </button>
                  </div>
                  {password && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={`h-1.5 flex-1 rounded-full ${i <= strength ? strengthColor[strength] : "bg-gray-200"}`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-gray-400">
                        Seguridad: <span className="font-semibold">{strengthLabel[strength]}</span>
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">
                    Confirmar contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (error) setError("");
                      }}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      required
                      className="w-full px-4 py-2.5 pr-10 border-2 border-gray-100 rounded-xl text-sm bg-gray-50 focus:outline-none focus:border-teal-400 focus:bg-white transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500"
                    >
                      {showConfirm ? "Ocultar" : "Mostrar"}
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || !hasRecoveryToken}
                  className="w-full py-3 rounded-xl font-black text-sm text-white transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ backgroundColor: "#1a2580", boxShadow: "0 4px 15px rgba(26,37,128,0.4)" }}
                >
                  {loading ? "Actualizando..." : "Actualizar contraseña →"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
