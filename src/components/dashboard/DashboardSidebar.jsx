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
    <aside className="h-full rounded-[28px] bg-white p-5 shadow-xl">
      <div className="rounded-3xl bg-cyan-600 p-5 text-white shadow-md">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-100">
          Back-office
        </p>
        <h2 className="mt-3 text-2xl font-black">La Cuponera</h2>
        <div className="mt-4 rounded-2xl bg-white/10 p-4">
          <p className="text-sm font-semibold text-white">{userName}</p>
          <span className="mt-4 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
            {roleLabel}
          </span>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-cyan-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-amber-400 hover:text-black"
        >
          Cerrar sesion
        </button>
      </div>

      <nav className="mt-5 space-y-2">
        {modules.map((module) => {
          const isActive = module.id === activeModuleId;

          return (
            <button
              key={module.id}
              type="button"
              onClick={() => onSelect(module.id)}
              className={`w-full rounded-2xl px-4 py-3 text-left transition ${
                isActive
                  ? "bg-cyan-950 text-white shadow-md"
                  : "bg-slate-100 text-slate-700 hover:bg-amber-100 hover:text-slate-900"
              }`}
            >
              <p className="text-sm font-bold">{module.title}</p>
              <p className={`mt-1 text-xs ${isActive ? "text-slate-200" : "text-slate-500"}`}>
                {module.shortLabel}
              </p>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
