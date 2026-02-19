import { useState } from "react";

export default function AuthComponent() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    email: "", password: "", name: "", lastName: "", confirmPassword: "",
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(mode === "login" ? `Bienvenido, ${form.email}!` : `Cuenta creada para ${form.name}!`);
  };

  const switchMode = (m) => {
    setMode(m);
    setForm({ email: "", password: "", name: "", lastName: "", confirmPassword: "" });
  };

  const inputClass =
    "w-full px-4 py-2.5 border-2 border-gray-100 rounded-xl text-sm bg-gray-50 focus:outline-none focus:border-teal-400 focus:bg-white transition-all";

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#1a2580" }}>

      {/* Navbar */}
      <nav className="h-14 flex items-center justify-between px-8" style={{ backgroundColor: "#0097a7" }}>
        <span className="text-white font-black text-lg tracking-wide">LA CUPONERA</span>
        <div className="flex items-center gap-4">
          <button onClick={() => switchMode("login")} className="text-white text-sm font-medium hover:underline">
            Login
          </button>
          <button
            onClick={() => switchMode("signup")}
            className="bg-black text-white text-sm font-semibold px-4 py-1.5 rounded-md hover:bg-gray-800 transition-colors"
          >
            Registrarse
          </button>
        </div>
      </nav>

      {/* Body */}
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">

          {/* Tabs */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-7">
            {["login", "signup"].map((tab) => (
              <button
                key={tab}
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
              {mode === "login" ? "Ofertas activas ahora mismo" : "¡Registro gratuito!"}
            </span>
          </div>

          <h2 className="text-2xl font-black mb-1" style={{ color: "#1a2580" }}>
            {mode === "login" ? "¡Bienvenido de vuelta!" : "Crea tu cuenta"}
          </h2>
          <p className="text-sm text-gray-400 mb-6">
            {mode === "login" ? (
              <>Accede a <span className="text-yellow-500 font-bold">descuentos exclusivos</span> en tu ciudad.</>
            ) : (
              <>Únete y ahorra con <span className="text-yellow-500 font-bold">ofertas increíbles</span> cada día.</>
            )}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Sign up only: Name row */}
            {mode === "signup" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Nombre</label>
                  <input type="text" name="name" placeholder="Juan" value={form.name} onChange={handleChange} required className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Apellido</label>
                  <input type="text" name="lastName" placeholder="Pérez" value={form.lastName} onChange={handleChange} required className={inputClass} />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Correo electrónico</label>
              <input type="email" name="email" placeholder="tucorreo@ejemplo.com" value={form.email} onChange={handleChange} required className={inputClass} />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Contraseña</label>
              <input
                type="password"
                name="password"
                placeholder={mode === "signup" ? "Mínimo 8 caracteres" : "••••••••"}
                value={form.password}
                onChange={handleChange}
                required
                className={inputClass}
              />
              {mode === "login" && (
                <div className="text-right mt-1">
                  <a href="#" className="text-xs font-semibold text-teal-500 hover:underline">¿Olvidaste tu contraseña?</a>
                </div>
              )}
            </div>

            {/* Sign up only: Confirm password */}
            {mode === "signup" && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Confirmar contraseña</label>
                <input type="password" name="confirmPassword" placeholder="••••••••" value={form.confirmPassword} onChange={handleChange} required className={inputClass} />
              </div>
            )}

            {/* Terms (signup) */}
            {mode === "signup" && (
              <p className="text-center text-xs text-gray-400">
                Al registrarte aceptas nuestros{" "}
                <a href="#" className="text-teal-500 font-semibold hover:underline">Términos de uso</a>{" "}
                y <a href="#" className="text-teal-500 font-semibold hover:underline">Política de privacidad</a>.
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="w-full py-3 rounded-xl font-black text-sm transition-all hover:-translate-y-0.5 active:translate-y-0"
              style={
                mode === "login"
                  ? { backgroundColor: "#f5a623", color: "#111", boxShadow: "0 4px 15px rgba(245,166,35,0.4)" }
                  : { backgroundColor: "#1a2580", color: "white", boxShadow: "0 4px 15px rgba(26,37,128,0.4)" }
              }
            >
              {mode === "login" ? "Iniciar Sesión →" : "Crear cuenta gratis →"}
            </button>
          </form>

          {/* Switch */}
          <p className="text-center text-xs text-gray-400 mt-5">
            {mode === "login" ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
            <button
              onClick={() => switchMode(mode === "login" ? "signup" : "login")}
              className="font-bold underline"
              style={{ color: "#1a2580" }}
            >
              {mode === "login" ? "Regístrate gratis" : "Inicia sesión"}
            </button>
          </p>

        </div>
      </div>
    </div>
  );
}
