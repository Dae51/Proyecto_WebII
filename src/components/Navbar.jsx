import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { supabase } from "../resources/supabaseClient";
import { useAuth } from "../context/AuthContext";
import { USER_ROLES } from "../resources/roles";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const { isAuthenticated, role, roleLabel, session, user } = useAuth();
  const userMetadata = user?.user_metadata ?? {};
  const userDisplayName =
    [userMetadata.first_name, userMetadata.last_name].filter(Boolean).join(" ").trim() ||
    userMetadata.full_name ||
    userMetadata.name ||
    user?.email ||
    "Usuario";

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Sesion cerrada correctamente.");
    setMenuOpen(false);
    navigate("/auth");
  };

  const handleGoToSettings = () => {
    setMenuOpen(false);
    toast.info("Modulo de ajustes en construccion.");
  };

  return (
    <nav className="relative z-40 flex items-center justify-between border-b border-white/10 bg-black px-4 py-3 text-slate-100 shadow-[0_12px_30px_rgba(0,0,0,0.55)] sm:px-6 md:px-8 md:py-4">
      <Link to="/">
        <button className="text-lg font-extrabold tracking-[0.16em] text-white transition hover:text-cyan-100 focus:outline-none sm:text-xl md:text-2xl">
          LA CUPONERA
        </button>
      </Link>

      <p className="pointer-events-none absolute left-1/2 hidden -translate-x-1/2 bg-gradient-to-r from-cyan-200 via-slate-100 to-amber-300 bg-clip-text text-xl font-extrabold tracking-wide text-transparent lg:block xl:text-2xl 2xl:text-3xl">
        ¡Ahorra y gana!
      </p>

      <div className="flex items-center gap-3 sm:gap-4">
        {isAuthenticated && role === USER_ROLES.CLIENT && (
          <Link to="/cupones-comprados">
            <button className="rounded-lg border border-cyan-100/10 bg-white/5 px-3 py-1.5 text-sm font-bold text-slate-100 transition hover:border-cyan-200/25 hover:bg-cyan-200/10 hover:text-cyan-100 sm:text-base">
              Mis cupones
            </button>
          </Link>
        )}

        {isAuthenticated && role !== USER_ROLES.CLIENT && (
          <Link to="/dashboard">
            <button className="text-white hover:text-white/90 transition font-bold text-sm sm:text-base">
              Dashboard
            </button>
          </Link>
        )}

        {!session ? (
          <>
            <button
              className="rounded-lg border border-cyan-100/10 bg-white/5 px-3 py-1.5 text-sm font-bold text-slate-100 transition hover:border-cyan-200/25 hover:bg-cyan-200/10 hover:text-cyan-100 sm:text-base"
              onClick={() => navigate("/auth")}
            >
              Login
            </button>

            <button
              className="rounded-lg border border-amber-200/40 bg-gradient-to-r from-amber-300 to-amber-400 px-3 py-1.5 text-sm font-bold text-slate-950 shadow-[0_6px_18px_rgba(251,191,36,0.25)] transition hover:brightness-105 sm:px-4 sm:py-2 sm:text-base"
              onClick={() => navigate("/auth")}
            >
              Registrarse
            </button>
          </>
        ) : (
          <div className="relative flex items-center gap-2" ref={menuRef}>
            <span
              className="hidden max-w-36 truncate text-sm font-semibold text-slate-200 sm:block sm:text-base"
              title={userDisplayName}
            >
              {userDisplayName}
            </span>
            <span className="hidden lg:inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-cyan-50 border border-white/20">
              {roleLabel}
            </span>
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-cyan-100/20 bg-[#08173d] text-cyan-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition hover:scale-105 hover:border-cyan-100/35 hover:bg-[#0b2256]"
              aria-label="Abrir menu de usuario"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>

            {menuOpen && (
              <div className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-xl border border-cyan-100/10 bg-[#07142f]/95 shadow-[0_18px_36px_rgba(0,0,0,0.45)] backdrop-blur-md">
                <button
                  type="button"
                  onClick={handleGoToSettings}
                  className="block w-full px-4 py-2.5 text-left text-sm text-slate-200 transition hover:bg-white/5"
                >
                  Ajustes
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="block w-full px-4 py-2.5 text-left text-sm text-red-300 transition hover:bg-red-400/10"
                >
                  Cerrar sesion
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
