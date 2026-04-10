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

  const loadCategorias = async () => {
    setLoading(true);
    const { data, error } = await fetchCategorias();
    if (error) {
      toast.error("Error al cargar rubros: " + error.message);
    } else {
      setCategorias(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadCategorias();
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
      <span className="font-semibold text-slate-900">{item.categories}</span>,
      
      // Cell 2: Creation Date
      new Date(item.created_at).toLocaleDateString(),
      
      // Cell 3: Actions
      canManage ? (
        <div className="flex gap-3">
          <button
            onClick={() => startEdit(item)}
            className="text-xs font-bold text-cyan-700 hover:text-cyan-800 transition"
          >
            Editar
          </button>
          <button
            onClick={() => handleDelete(item.id)}
            className="text-xs font-bold text-rose-600 hover:text-rose-700 transition"
          >
            Borrar
          </button>
        </div>
      ) : (
        <span className="text-xs text-slate-400">Sólo lectura</span>
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
          <form onSubmit={handleSubmit} className="flex flex-col items-start gap-4 sm:flex-row sm:items-center rounded-[20px] bg-slate-50 p-4 border border-slate-100">
            <div className="flex-1 w-full max-w-sm">
              <input
                type="text"
                placeholder={editingId ? "Actualizar nombre del rubro..." : "Escribe el nombre del nuevo rubro..."}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="inline-flex w-full sm:w-auto items-center justify-center rounded-lg bg-cyan-950 px-5 py-2.5 text-sm font-bold text-white shadow hover:bg-amber-400 hover:text-black transition"
            >
              {editingId ? "Actualizar Categoría" : "Crear Categoría"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="inline-flex w-full sm:w-auto items-center justify-center rounded-lg bg-slate-400 px-5 py-2.5 text-sm font-bold text-white shadow hover:bg-slate-500 transition"
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
          <div className="py-8 text-center text-sm font-medium text-slate-500 border border-dashed border-slate-200 rounded-3xl">
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
