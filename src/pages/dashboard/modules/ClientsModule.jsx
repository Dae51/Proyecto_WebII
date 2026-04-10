import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { DataTable, SectionCard } from "../../../components/dashboard/ModuleUI";
import { fetchClientesPaginated } from "../../../resources/ClientsService";
import { supabase } from "../../../resources/supabaseClient";

export default function ClientsModule() {
  const [hasAccess, setHasAccess] = useState(null); // null = checking, true/false
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination State
  const [page, setPage] = useState(0);
  const [count, setCount] = useState(0);

  const pageSize = 10;
  const totalPages = Math.ceil(count / pageSize);

  useEffect(() => {
    let mounted = true;

    const checkAccessAndLoad = async () => {
      setLoading(true);

      // 1. Validar acceso por rol (flexibilizado temporalmente)
      const { data: { user } } = await supabase.auth.getUser();

      // Busca el rol en ambos lados y lo pasamos a MAYÚSCULAS o se asume vacío.
      const rawRole = user?.app_metadata?.role || user?.user_metadata?.role;
      const role = String(rawRole || '').toUpperCase();

      if (role !== 'ADMIN') {
        if (mounted) setHasAccess(false);
        return;
      }

      if (mounted) setHasAccess(true);

      // 2. Fetch de datos paginados
      const { data, error, count: totalRows } = await fetchClientesPaginated(page, pageSize);
      if (!mounted) return;

      if (error) {
        toast.error("Error al cargar clientes: " + error.message);
      } else {
        setClientes(data || []);
        if (totalRows !== null) setCount(totalRows);
      }

      setLoading(false);
    };

    checkAccessAndLoad();

    return () => { mounted = false; };
  }, [page]);

  if (hasAccess === false) {
    return (
      <SectionCard title="Acceso Restringido">
        <div className="py-12 flex flex-col items-center justify-center text-center">
          <p className="text-rose-600 font-bold mb-2">Permisos insuficientes</p>
          <p className="text-slate-600 max-w-md">No tienes los privilegios necesarios para ver esta sección. Es estricta y únicamente para personal registrado como Administrador Principal.</p>
        </div>
      </SectionCard>
    );
  }

  // Convert DB fields to string rows matching the DataTable format
  const rows = clientes.map((c) => {
    const fullName = `${c.name || ""} ${c.last_name || ""}`.trim() || "Sin nombre";
    return [
      fullName,
      c.mail || "N/A",
      c.phone || "N/A",
      c.address || "N/A",
      c.DUI || "N/A"
    ];
  });

  return (
    <SectionCard
      title="Clientes"
      subtitle="Base de datos principal de clientes registrados a través de la tienda pública."
    >
      {hasAccess === null || loading ? (
        <div className="py-12 flex items-center justify-center">
          <p className="text-sm font-medium text-slate-500 animate-pulse">Obteniendo directorio de clientes...</p>
        </div>
      ) : clientes.length === 0 ? (
        <div className="py-12 text-center text-sm font-medium text-slate-500 border border-dashed border-slate-200 rounded-3xl">
          No hay registros de clientes encontrados o el listado se encuentra vacío en la base de datos.
        </div>
      ) : (
        <div className="space-y-6">
          <DataTable
            columns={["Nombre Completo", "Correo Electrónico", "Teléfono", "Dirección", "DUI"]}
            rows={rows}
          />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2 border-t border-slate-100 mt-4 pt-4">
            <span className="text-sm font-bold text-slate-500">
              Página <span className="text-slate-900">{page + 1}</span> de <span className="text-slate-900">{totalPages || 1}</span>
            </span>

            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page <= 0}
                className="flex-1 sm:flex-none justify-center rounded-lg bg-white border border-slate-300 px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition disabled:opacity-40 disabled:hover:bg-white"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages - 1}
                className="flex-1 sm:flex-none justify-center rounded-lg bg-cyan-950 px-5 py-2.5 text-sm font-bold text-white shadow hover:bg-amber-400 hover:text-black transition disabled:opacity-40 disabled:hover:bg-cyan-950 disabled:hover:text-white"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      )}
    </SectionCard>
  );
}
