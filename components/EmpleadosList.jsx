import React from "react";

export default function EmpleadosList({
  empleados,
  onSelectEmpleado,
  onDeleteEmpleado,
  deletingId = null,
  canManage = true,
}) {
  if (!empleados.length) {
    return (
      <div className="rounded-3xl border border-dashed border-white/10 px-4 py-10 text-center text-sm font-medium text-slate-400">
        No employees found for this company yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-white/10">
          <thead className="bg-white/5">
            <tr>
              {["Name", "Last name", "DUI", "Phone", "Email", "Address", "Actions"].map((column) => (
                <th
                  key={column}
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-400"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-white/8">
            {empleados.map((empleado) => (
              <tr
                key={empleado.id}
                onClick={() => canManage && onSelectEmpleado?.(empleado)}
                className={canManage ? "cursor-pointer bg-transparent transition hover:bg-white/5" : ""}
              >
                <td className="px-4 py-4 text-sm font-semibold text-white">{empleado.name}</td>
                <td className="px-4 py-4 text-sm text-slate-300">{empleado.last_name}</td>
                <td className="px-4 py-4 text-sm text-slate-300">{empleado.DUI}</td>
                <td className="px-4 py-4 text-sm text-slate-300">{empleado.phone}</td>
                <td className="px-4 py-4 text-sm text-slate-300">{empleado.email}</td>
                <td className="px-4 py-4 text-sm text-slate-300">{empleado.address || "No address"}</td>
                <td className="px-4 py-4 text-sm text-slate-300">
                  <div className="flex gap-3">
                    {canManage ? (
                      <>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onSelectEmpleado?.(empleado);
                          }}
                          className="text-xs font-bold text-cyan-400 transition hover:text-cyan-300"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            if (window.confirm("Are you sure?")) {
                              onDeleteEmpleado?.(empleado);
                            }
                          }}
                          disabled={deletingId === empleado.id}
                          className="text-xs font-bold text-rose-400 transition hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingId === empleado.id ? "Deleting..." : "Delete"}
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-slate-500">Read only</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
