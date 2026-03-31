import React from "react";
import { DataTable, SectionCard } from "../../../components/dashboard/ModuleUI";

const SAMPLE_EMPLOYEES = [
  { name: "Erick Empleado", email: "empleado.prueba@lacuponera.com", branch: "Sucursal Centro", status: "Activo" },
  { name: "Paola Rivas", email: "paola@empresa.com", branch: "Sucursal Escalon", status: "Activo" },
  { name: "Jorge Cruz", email: "jorge@empresa.com", branch: "Sucursal Santa Tecla", status: "Suspendido" },
];

export default function EmployeesModule({ canManage }) {
  return (
    <SectionCard
      title="Empleados"
      subtitle="Administracion del personal autorizado para operar y canjear cupones."
      actionLabel="Nuevo empleado"
      actionVisible={canManage}
    >
      <DataTable
        columns={["Empleado", "Correo", "Sucursal", "Estado"]}
        rows={SAMPLE_EMPLOYEES.map((item) => [item.name, item.email, item.branch, item.status])}
      />
    </SectionCard>
  );
}
