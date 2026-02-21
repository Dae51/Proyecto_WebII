import { supabase } from "./supabaseClient";

function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function normalizeStatus(status) {
  return String(status ?? "").trim().toLowerCase();
}

function isAllowedStatus(status) {
  if (!status) return true;
  return ["approved", "aprobado", "active", "activo", "published", "publicado"].includes(status);
}

export function normalizeTipoEnum(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/restaurantes/g, "restaurante");
}

function normalizeCupon(row) {
  const regular = toNumber(
    row.regular_price ??
      row.precio_regular ??
      row.precio_normal ??
      row.price ??
      row.precio
  );

  const offer = toNumber(
    row.offer_price ??
      row.precio_oferta ??
      row.precio_descuento ??
      row.discount_price ??
      row.precio_final
  );

  const regular_price = regular || offer;
  const offer_price = offer || regular || 0;

  const imageSrc =
    row.image_url ??
    row.imagen_url ??
    row.imagen ??
    row.image ??
    row.foto_url ??
    row.foto ??
    row.url_imagen ??
    null;

  const tipo = normalizeTipoEnum(
    row.tipo ??
      row.rubro ??
      row.categoria ??
      row.tipo_cupon ??
      row.tipo_oferta ??
      row.category
  ) || "otros";

  return {
    id: row.id,
    title: row.title ?? row.titulo ?? row.nombre ?? "Oferta sin titulo",
    description: row.description ?? row.descripcion ?? "",
    regular_price,
    offer_price,
    rubro: tipo,
    status: normalizeStatus(row.status ?? row.estado),
    start_date: row.start_date ?? row.fecha_inicio ?? row.created_at ?? null,
    end_date: row.end_date ?? row.fecha_fin ?? row.expires_at ?? null,
    redeemed_at: row.redeemed_at ?? null,
    image_url: imageSrc,
  };
}

function isActiveOffer(offer) {
  const today = new Date();
  const start = offer.start_date ? new Date(offer.start_date) : null;
  const end = offer.end_date ? new Date(offer.end_date) : null;
  const redeemedAt = offer.redeemed_at ? new Date(offer.redeemed_at) : null;
  const status = normalizeStatus(offer.status);

  const hasRedeemed = !!redeemedAt;
  const approved = isAllowedStatus(status);
  const started = !start || Number.isNaN(start.getTime()) || today >= start;
  const notExpired = !end || Number.isNaN(end.getTime()) || today <= end;

  return !hasRedeemed && approved && started && notExpired;
}

export async function getCupones() {
  try {
    const { data, error } = await supabase.from("cupones").select("*");

    if (error) {
      return { cupones: [], error };
    }

    const normalized = (data ?? []).map(normalizeCupon);
    return { cupones: normalized, error: null };
  } catch (error) {
    return { cupones: [], error };
  }
}

export async function getCuponesActivos() {
  const { cupones, error } = await getCupones();
  if (error) return { cupones: [], error };

  const active = cupones.filter(isActiveOffer);
  return { cupones: active, error: null };
}

export function filterCuponesByTipo(cupones, tipo) {
  const target = normalizeTipoEnum(tipo);
  if (!target || target === "todas") return cupones;

  return (cupones ?? []).filter((cupon) => {
    return normalizeTipoEnum(cupon.rubro) === target;
  });
}
