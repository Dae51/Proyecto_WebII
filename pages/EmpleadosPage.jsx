import React, { useMemo, useState } from "react";
import { toast } from "react-toastify";
import EmpleadoForm from "../components/EmpleadoForm.jsx";
import EmpleadosList from "../components/EmpleadosList.jsx";
import useEmpleados from "../hooks/useEmpleados.js";
import { SectionCard, StatCard } from "../src/components/dashboard/ModuleUI.jsx";

export default function EmpleadosPage({ canManage = true }) {
  const {
    empleados,
    loading,
    error,
    createEmpleado,
    updateEmpleado,
    deleteEmpleado,
    refreshEmpleados,
  } = useEmpleados();

  const [selectedEmpleado, setSelectedEmpleado] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const formMode = isCreating ? "create" : selectedEmpleado ? "edit" : null;
  const formTitle = isCreating ? "Nuevo empleado" : selectedEmpleado ? "Editar empleado" : "Empleado";

  const helperStats = useMemo(() => {
    return {
      total: String(empleados.length).padStart(2, "0"),
      mode: isCreating ? "Crear" : selectedEmpleado ? "Editar" : "Libre",
    };
  }, [empleados.length, isCreating, selectedEmpleado]);

  const resetForm = () => {
    setIsCreating(false);
    setSelectedEmpleado(null);
    setModalOpen(false);
  };

  const handleCreateClick = () => {
    setSelectedEmpleado(null);
    setIsCreating(true);
    setModalOpen(true);
  };

  const handleSelectEmpleado = (empleado) => {
    setSelectedEmpleado(empleado);
    setIsCreating(false);
    setModalOpen(true);
  };

  const handleSubmit = async (values) => {
    setSaving(true);

    const result = formMode === "edit" && selectedEmpleado
      ? await updateEmpleado(selectedEmpleado.id, values)
      : await createEmpleado(values);

    setSaving(false);

    if (result.error) {
      toast.error(result.error.message);
      return;
    }

    toast.success(formMode === "edit" ? "Empleado actualizado correctamente." : "Empleado creado correctamente.");
    resetForm();
  };

  const handleDelete = async (empleado) => {
    setDeletingId(empleado.id);
    const result = await deleteEmpleado(empleado.id);
    setDeletingId(null);

    if (result.error) {
      toast.error(result.error.message);
      return;
    }

    toast.success("Empleado eliminado correctamente.");
    if (selectedEmpleado?.id === empleado.id) {
      resetForm();
    }
  };

  if (!canManage) {
    return (
      <SectionCard
        title="Employees"
        subtitle="This module is only available for company administrators."
      >
        <div className="rounded-3xl border border-rose-400/20 bg-rose-400/10 px-4 py-8 text-sm font-medium text-rose-200">
          You do not have permission to manage employees.
        </div>
      </SectionCard>
    );
  }

  return (
    <div className="space-y-6">
      <SectionCard
        title="Empleados"
        subtitle="Administra únicamente a los empleados que pertenecen a tu empresa."
        actionVisible={true}
        action={
          <button
            type="button"
            onClick={handleCreateClick}
            className="btn-primary"
            disabled={saving || deletingId !== null}
          >
            Nuevo empleado
          </button>
        }
      >
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            title="Empleados"
            value={loading ? "-" : helperStats.total}
            accent="text-cyan-400"
            helper="Sólo se listan empleados de tu empresa."
          />
          <StatCard
            title="Modo actual"
            value={helperStats.mode}
            accent="text-emerald-400"
            helper="Cambia según la acción que selecciones."
          />
          <StatCard
            title="Estado"
            value={loading ? "Cargando" : "Listo"}
            accent="text-amber-300"
            helper="Puedes refrescar si hubo cambios externos."
          />
        </div>

        {error ? (
          <div className="mt-6 rounded-3xl border border-rose-400/20 bg-rose-400/10 px-4 py-4 text-sm font-medium text-rose-200">
            {error}
          </div>
        ) : null}

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.8fr)_minmax(320px,1fr)]">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-bold text-white">Listado de empleados</h3>
              <button
                type="button"
                onClick={refreshEmpleados}
                className="btn-secondary"
                disabled={loading || saving || deletingId !== null}
              >
                Refrescar
              </button>
            </div>

            {loading ? (
              <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-10 text-center text-sm font-medium text-slate-400">
                Cargando empleados...
              </div>
            ) : (
              <EmpleadosList
                empleados={empleados}
                onSelectEmpleado={handleSelectEmpleado}
                onDeleteEmpleado={handleDelete}
                deletingId={deletingId}
                canManage={canManage}
              />
            )}
          </div>
        </div>
      </SectionCard>

      <EmpleadoForm
        key={`${formMode}-${selectedEmpleado?.id ?? "new"}-${modalOpen ? "open" : "closed"}`}
        isOpen={modalOpen && Boolean(formMode)}
        title={formTitle}
        mode={formMode ?? "create"}
        initialValues={selectedEmpleado}
        saving={saving}
        submitError={error}
        onSubmit={handleSubmit}
        onCancel={resetForm}
      />
    </div>
  );
}
