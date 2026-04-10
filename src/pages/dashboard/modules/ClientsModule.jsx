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
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="mb-2 font-bold text-rose-400">Permisos insuficientes</p>
          <p className="max-w-md text-slate-400">No tienes los privilegios necesarios para ver esta sección. Es estricta y únicamente para personal registrado como Administrador Principal.</p>
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
        <div className="flex items-center justify-center py-12">
          <p className="animate-pulse text-sm font-medium text-slate-500">Obteniendo directorio de clientes...</p>
        </div>
      ) : clientes.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/10 py-12 text-center text-sm font-medium text-slate-400">
          No hay registros de clientes encontrados o el listado se encuentra vacío en la base de datos.
        </div>
      ) : (
        <div className="space-y-6">
          <DataTable
            columns={["Nombre Completo", "Correo Electrónico", "Teléfono", "Dirección", "DUI"]}
            rows={rows}
          />

          <div className="mt-4 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-4 sm:flex-row">
            <span className="text-sm font-bold text-slate-500">
              Página <span className="text-white">{page + 1}</span> de <span className="text-white">{totalPages || 1}</span>
            </span>

            <div className="flex w-full gap-2 sm:w-auto">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page <= 0}
                className="btn-secondary flex-1 justify-center sm:flex-none disabled:opacity-40"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages - 1}
                className="btn-primary flex-1 justify-center sm:flex-none disabled:opacity-40"
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
