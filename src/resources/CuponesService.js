import { supabase } from "./supabaseClient";

function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function roundCurrency(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function buildFallbackOfferPrice(couponId) {
  // Precio determinista para evitar valores aleatorios entre recargas cuando la tabla no trae precios.
  const text = String(couponId ?? "");
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) % 100000;
  }
  return 15 + (hash % 36); // Rango: 15 - 50
}

function normalizePrices({ couponId, regular, offer }) {
  let regularPrice = toNumber(regular);
  let offerPrice = toNumber(offer);

  if (regularPrice > 0 && offerPrice > 0) {
    const topPrice = Math.max(regularPrice, offerPrice);
    const lowPrice = Math.min(regularPrice, offerPrice);
    regularPrice = topPrice;
    offerPrice = lowPrice;
  } else if (regularPrice > 0) {
    offerPrice = roundCurrency(regularPrice * 0.8);
  } else if (offerPrice > 0) {
    regularPrice = roundCurrency(offerPrice * 1.25);
  } else {
    offerPrice = buildFallbackOfferPrice(couponId);
    regularPrice = roundCurrency(offerPrice * 1.25);
  }

  if (offerPrice >= regularPrice) {
    offerPrice = roundCurrency(Math.max(0.01, regularPrice - 0.01));
  }

  return {
    regular_price: roundCurrency(regularPrice),
    offer_price: roundCurrency(offerPrice),
  };
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
  const rawRegular = toNumber(
    row.regular_price ??
      row.precio_regular ??
      row.precio_normal ??
      row.price ??
      row.precio
  );

  const rawOffer = toNumber(
    row.offer_price ??
      row.precio_oferta ??
      row.precio_descuento ??
      row.discount_price ??
      row.precio_final
  );

  const { regular_price, offer_price } = normalizePrices({
    couponId: row.id,
    regular: rawRegular,
    offer: rawOffer,
  });

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
