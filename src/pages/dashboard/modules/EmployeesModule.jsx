import React from "react";
import EmpleadosPage from "../../../../pages/EmpleadosPage.jsx";

export default function EmployeesModule({ canManage }) {
  return <EmpleadosPage canManage={canManage} />;
}
