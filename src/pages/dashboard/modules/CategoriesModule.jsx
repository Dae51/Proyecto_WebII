import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { DataTable, SectionCard } from "../../../components/dashboard/ModuleUI";
import { fetchCategorias, createCategoria, updateCategoria, deleteCategoria } from "../../../resources/CategoryService";

export default function CategoriesModule({ canManage }) {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);

  // State for Create/Edit form
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      const { data, error } = await fetchCategorias();
      if (!mounted) return;

      if (error) {
        toast.error("Error al cargar rubros: " + error.message);
      } else {
        setCategorias(data || []);
      }

      setLoading(false);
    };

    run();

    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const name = newCategoryName.trim();

    if (!name) {
      toast.error("El nombre del rubro no puede estar vacío.");
      return;
    }

    if (editingId) {
      // Update Logic
      const { data, error } = await updateCategoria(editingId, name);
      if (error) {
        toast.error("Error al actualizar el rubro: " + error.message);
      } else if (data) {
        toast.success("Rubro actualizado con éxito.");
        setCategorias(categorias.map((c) => (c.id === editingId ? data : c)));
        setEditingId(null);
        setNewCategoryName("");
      }
    } else {
      // Create Logic
      if (categorias.some(c => c.categories.toLowerCase() === name.toLowerCase())) {
        toast.warn("Ya existe un rubro con ese nombre.");
        return;
      }

      const { data, error } = await createCategoria(name);
      if (error) {
        toast.error("Error al crear el rubro: " + error.message);
      } else if (data) {
        toast.success("Rubro creado exitosamente.");
        setNewCategoryName("");
        setCategorias([data, ...categorias]);
      }
    }
  };

  const startEdit = (cat) => {
    setEditingId(cat.id);
    setNewCategoryName(cat.categories);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNewCategoryName("");
  };

  const handleDelete = async (id) => {
    const { error } = await deleteCategoria(id);
    if (error) {
      toast.error("No se pudo eliminar: " + error.message);
    } else {
      toast.success("Rubro eliminado.");
      setCategorias(categorias.filter((c) => c.id !== id));
      if (editingId === id) cancelEdit();
    }
  };

  // Convert objects to array rows representing cells
  const rows = categorias.map((item) => {
    return [
      // Cell 1: Category Name
      <span className="font-semibold text-white">{item.categories}</span>,

      // Cell 2: Creation Date
      <span className="text-slate-400">{new Date(item.created_at).toLocaleDateString()}</span>,

      // Cell 3: Actions
      canManage ? (
        <div className="flex gap-3">
          <button
            onClick={() => startEdit(item)}
            className="text-xs font-bold text-cyan-400 transition hover:text-cyan-300"
          >
            Editar
          </button>
          <button
            onClick={() => handleDelete(item.id)}
            className="text-xs font-bold text-rose-400 transition hover:text-rose-300"
          >
            Borrar
          </button>
        </div>
      ) : (
        <span className="text-xs text-slate-500">Sólo lectura</span>
      )
    ];
  });

  return (
    <SectionCard
      title="Rubros"
      subtitle="Catálogo para clasificar promociones y alimentar los filtros de la tienda pública."
      actionVisible={false}
    >
      <div className="mb-6 space-y-6">
        {canManage && (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col items-start gap-4 rounded-[20px] border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center"
          >
            <div className="w-full max-w-sm flex-1">
              <input
                type="text"
                placeholder={editingId ? "Actualizar nombre del rubro..." : "Escribe el nombre del nuevo rubro..."}
                className="bo-input w-full"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="btn-primary w-full sm:w-auto"
            >
              {editingId ? "Actualizar Categoría" : "Crear Categoría"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="btn-secondary w-full sm:w-auto"
              >
                Cancelar
              </button>
            )}
          </form>
        )}

        {loading ? (
          <div className="py-8 text-center text-sm font-medium text-slate-500">
            Cargando el catálogo de rubros...
          </div>
        ) : categorias.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 py-8 text-center text-sm font-medium text-slate-400">
            Aún no hay categorías registradas en la plataforma.
          </div>
        ) : (
          <DataTable
            columns={["Rubro", "Fecha Creado", "Acciones"]}
            rows={rows}
          />
        )}
      </div>
    </SectionCard>
  );
}
