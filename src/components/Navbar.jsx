import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { supabase } from "../resources/supabaseClient";

export default function Navbar() {
  const [session, setSession] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const bootstrapSession = async () => {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      if (mounted) {
        setSession(currentSession);
      }
    };

    bootstrapSession();

    const { data } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (!mounted) return;
      setSession(currentSession);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

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
    <nav className="bg-cyan-600 text-fuchsia-200 px-4 sm:px-6 md:px-8 py-3 md:py-4 flex justify-between items-center font-sans shadow">
      <Link to="/">
        <button className="text-lg sm:text-xl md:text-2xl font-extrabold tracking-wide focus:outline-none">
          LA CUPONERA
        </button>
      </Link>

      <div className="flex items-center gap-3 sm:gap-4">
        {!session ? (
          <>
            <button
              className="hover:text-rose-300 transition font-bold text-sm sm:text-base"
              onClick={() => navigate("/auth")}
            >
              Login
            </button>

            <button
              className="bg-black px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-rose-300 hover:text-black transition font-bold text-sm sm:text-base"
              onClick={() => navigate("/auth")}
            >
              Registrarse
            </button>
          </>
        ) : (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="h-10 w-10 rounded-full bg-slate-900 text-white flex items-center justify-center border-2 border-white/60 hover:scale-105 transition"
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
              <div className="absolute right-0 mt-2 w-44 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden z-50">
                <button
                  type="button"
                  onClick={handleGoToSettings}
                  className="block w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Ajustes
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
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
