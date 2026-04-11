import React from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { supabase } from "../../resources/supabaseClient";

export default function DashboardSidebar({
  modules,
  activeModuleId,
  onSelect,
  roleLabel,
  userName,
  userEmail,
}) {
  const navigate = useNavigate();

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Sesion cerrada correctamente.");
    navigate("/auth");
  }

  return (
    <aside className="h-full rounded-[28px] border border-white/10 bg-[#07142f] p-5 shadow-xl">
      {/* Header: identidad de la app */}
      <div className="rounded-3xl border border-white/10 bg-[#020b24] p-5">
        <h2 className="mt-3 text-2xl font-black text-white">La Cuponera</h2>

        {/* Info del usuario */}
        <div className="mt-4 rounded-2xl border border-white/8 bg-white/5 p-4">
          <p className="text-sm font-semibold text-white">{userName}</p>
          <span className="mt-3 inline-flex rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-300">
            {roleLabel}
          </span>
        </div>

        {/* Botón logout — gradiente amber idéntico al CTA del sitio público */}
        <button
          type="button"
          onClick={handleLogout}
          className="btn-primary mt-4 w-full"
        >
          Cerrar sesion
        </button>
      </div>

      {/* Navegación */}
      <nav className="mt-5 space-y-2">
        {modules.map((module) => {
          const isActive = module.id === activeModuleId;

          return (
            <button
              key={module.id}
              type="button"
              onClick={() => onSelect(module.id)}
              className={`w-full rounded-2xl px-4 py-3 text-left transition ${isActive
                  ? "bg-gradient-to-r from-amber-300 to-amber-400 text-black shadow-md shadow-amber-400/20"
                  : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
            >
              <p className="text-sm font-bold">{module.title}</p>
              <p className={`mt-1 text-xs ${isActive ? "text-black/60" : "text-slate-500"}`}>
                {module.shortLabel}
              </p>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
