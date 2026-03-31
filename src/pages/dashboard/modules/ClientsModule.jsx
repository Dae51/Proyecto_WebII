import React from "react";
import { DataTable, SectionCard } from "../../../components/dashboard/ModuleUI";

const SAMPLE_CLIENTS = [
  { name: "Claudia Cliente", email: "cliente.prueba@lacuponera.com", available: 5, redeemed: 2, expired: 1 },
  { name: "Mario Lopez", email: "mario@correo.com", available: 3, redeemed: 1, expired: 0 },
  { name: "Sofia Garcia", email: "sofia@correo.com", available: 7, redeemed: 4, expired: 2 },
];

export default function ClientsModule() {
  return (
    <SectionCard
      title="Clientes"
      subtitle="Consulta rapida de clientes y distribucion de cupones disponibles, canjeados y vencidos."
    >
      <DataTable
        columns={["Cliente", "Correo", "Disponibles", "Canjeados", "Vencidos"]}
        rows={SAMPLE_CLIENTS.map((item) => [item.name, item.email, String(item.available), String(item.redeemed), String(item.expired)])}
      />
    </SectionCard>
  );
}
