import React from "react";
import { DataTable, SectionCard } from "../../../components/dashboard/ModuleUI";

const SAMPLE_CATEGORIES = [
  { name: "Restaurante", offers: 14, status: "Publicado" },
  { name: "Belleza", offers: 8, status: "Publicado" },
  { name: "Talleres", offers: 5, status: "Borrador" },
];

export default function CategoriesModule({ canManage }) {
  return (
    <SectionCard
      title="Rubros"
      subtitle="Catalogo para clasificar promociones y alimentar los filtros de la tienda publica."
      actionLabel="Nuevo rubro"
      actionVisible={canManage}
    >
      <DataTable
        columns={["Rubro", "Ofertas", "Estado"]}
        rows={SAMPLE_CATEGORIES.map((item) => [item.name, String(item.offers), item.status])}
      />
    </SectionCard>
  );
}
