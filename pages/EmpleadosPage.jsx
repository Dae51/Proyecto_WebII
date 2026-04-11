import React, { useMemo, useState } from "react";
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
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const formMode = isCreating ? "create" : selectedEmpleado ? "edit" : null;
  const formTitle = isCreating ? "New employee" : selectedEmpleado ? "Edit employee" : "Employee form";
  const formDescription = isCreating
    ? "Create a new employee for your current company."
    : selectedEmpleado
      ? "Update the selected employee information."
      : "Select an employee from the list or create a new one.";

  const helperStats = useMemo(() => {
    return {
      total: String(empleados.length).padStart(2, "0"),
      mode: isCreating ? "Create" : selectedEmpleado ? "Edit" : "Idle",
    };
  }, [empleados.length, isCreating, selectedEmpleado]);

  const resetForm = () => {
    setIsCreating(false);
    setSelectedEmpleado(null);
  };

  const handleCreateClick = () => {
    setSelectedEmpleado(null);
    setIsCreating(true);
  };

  const handleSelectEmpleado = (empleado) => {
    setSelectedEmpleado(empleado);
    setIsCreating(false);
  };

  const handleSubmit = async (values) => {
    setSaving(true);

    const result = formMode === "edit" && selectedEmpleado
      ? await updateEmpleado(selectedEmpleado.id, values)
      : await createEmpleado(values);

    setSaving(false);

    if (result.error) {
      return;
    }

    resetForm();
  };

  const handleDelete = async (empleado) => {
    setDeletingId(empleado.id);
    const result = await deleteEmpleado(empleado.id);
    setDeletingId(null);

    if (result.error) {
      return;
    }

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
        title="Employees"
        subtitle="Manage the employees that belong to the authenticated company."
        actionVisible={true}
        action={
          <button
            type="button"
            onClick={handleCreateClick}
            className="btn-primary"
            disabled={saving || deletingId !== null}
          >
            New employee
          </button>
        }
      >
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            title="Employees"
            value={loading ? "-" : helperStats.total}
            accent="text-cyan-400"
            helper="Only employees from your company are listed."
          />
          <StatCard
            title="Form mode"
            value={helperStats.mode}
            accent="text-emerald-400"
            helper="Create or edit mode changes automatically."
          />
          <StatCard
            title="Refresh"
            value={loading ? "Loading" : "Ready"}
            accent="text-amber-300"
            helper="Use refresh if your data changed externally."
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
              <h3 className="text-lg font-bold text-white">Employee list</h3>
              <button
                type="button"
                onClick={refreshEmpleados}
                className="btn-secondary"
                disabled={loading || saving || deletingId !== null}
              >
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-10 text-center text-sm font-medium text-slate-400">
                Loading employees...
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

          <div className="rounded-[28px] border border-white/10 bg-[#07142f] p-6 shadow-xl">
            <div className="mb-5">
              <h3 className="text-xl font-black text-white">{formTitle}</h3>
              <p className="mt-2 text-sm text-slate-400">{formDescription}</p>
            </div>

            {formMode ? (
              <EmpleadoForm
                key={`${formMode}-${selectedEmpleado?.id ?? "new"}`}
                mode={formMode}
                initialValues={selectedEmpleado}
                saving={saving}
                onSubmit={handleSubmit}
                onCancel={resetForm}
              />
            ) : (
              <div className="rounded-3xl border border-dashed border-white/10 px-4 py-10 text-center text-sm font-medium text-slate-400">
                Select an employee from the list or click “New employee” to start.
              </div>
            )}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
