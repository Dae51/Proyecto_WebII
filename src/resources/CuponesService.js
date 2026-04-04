import { supabase } from "./supabaseClient";
import { normalizeText } from "./validator";

export const COUPON_STATES = {
  PENDING: "Pendiente_aprobacion",
  APPROVED: "Aprobado",
  ELIMINATED: "Eliminado",
  REJECTED: "Rechazado",
};

export const COUPON_STATE_LABELS = {
  [COUPON_STATES.PENDING]: "Pendiente de aprobación",
  [COUPON_STATES.APPROVED]: "Aprobado",
  [COUPON_STATES.ELIMINATED]: "Eliminado",
  [COUPON_STATES.REJECTED]: "Rechazado",
};

export const COUPON_IMAGE_BUCKET = "cupones";

const VALID_COUPON_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

export const CATEGORY_OPTIONS = [
  { value: "Restaurante", label: "Restaurante" },
  { value: "Belleza", label: "Belleza" },
  { value: "Talleres", label: "Talleres" },
  { value: "Tecnologia", label: "Tecnologia" },
  { value: "Entretenimiento", label: "Entretenimiento" },
  { value: "Otros", label: "Otros" },
];

function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function roundCurrency(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function buildFallbackOfferPrice(couponId) {
  const text = String(couponId ?? "");
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) % 100000;
  }
  return 15 + (hash % 36);
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

function buildServiceError(error, fallbackMessage, status = 500) {
  return {
    status,
    message: error?.message || fallbackMessage,
    details: error ?? null,
  };
}

function normalizeStatus(status) {
  return String(status ?? "").trim().toLowerCase();
}

export function normalizeCouponState(value) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (!normalized) return COUPON_STATES.PENDING;
  if (normalized === "pendiente_aprobacion" || normalized === "pendiente" || normalized === "pending") {
    return COUPON_STATES.PENDING;
  }
  if (
    normalized === "aprobado" ||
    normalized === "approved" ||
    normalized === "publicado" ||
    normalized === "published" ||
    normalized === "active" ||
    normalized === "activo" ||
    normalized === "activa"
  ) {
    return COUPON_STATES.APPROVED;
  }
  if (normalized === "rechazado" || normalized === "rejected") {
    return COUPON_STATES.REJECTED;
  }
  if (normalized === "eliminado" || normalized === "deleted" || normalized === "discarded") {
    return COUPON_STATES.ELIMINATED;
  }
  return COUPON_STATES.PENDING;
}

export function getCouponStateLabel(value) {
  return COUPON_STATE_LABELS[normalizeCouponState(value)] ?? COUPON_STATE_LABELS[COUPON_STATES.PENDING];
}

export function normalizeTipoEnum(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/restaurantes/g, "restaurante");
}

export function normalizeCouponCategory(value) {
  const normalized = normalizeTipoEnum(value);

  if (normalized === "restaurante") return "Restaurante";
  if (normalized === "belleza") return "Belleza";
  if (normalized === "taller" || normalized === "talleres") return "Talleres";
  if (normalized === "tecnologia") return "Tecnologia";
  if (normalized === "entretenimiento") return "Entretenimiento";
  return "Otros";
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

  const category = normalizeCouponCategory(
    row.category ??
      row.tipo ??
      row.rubro ??
      row.categoria ??
      row.tipo_cupon ??
      row.tipo_oferta
  );

  const state = normalizeCouponState(row.state ?? row.status ?? row.estado);

  return {
    id: row.id,
    code: row.code ?? "",
    title: row.title ?? row.titulo ?? row.nombre ?? "Oferta sin titulo",
    description: row.description ?? row.descripcion ?? "",
    terms: row.terms ?? row.terminos ?? "",
    precio: roundCurrency(rawOffer > 0 ? rawOffer : rawRegular),
    regular_price,
    offer_price,
    category,
    rubro: normalizeTipoEnum(category) || "otros",
    state,
    state_label: getCouponStateLabel(state),
    status: normalizeStatus(state),
    created_at: row.created_at ?? null,
    start_date: row.start_date ?? row.fecha_inicio ?? row.created_at ?? null,
    expires_at: row.expires_at ?? row.end_date ?? row.fecha_fin ?? row.expires_at ?? null,
    end_date: row.end_date ?? row.fecha_fin ?? row.expires_at ?? null,
    redeemed_at: row.redeemed_at ?? null,
    image: imageSrc,
    image_url: imageSrc,
    user_id: row.user_id ?? null,
    stock: toNumber(row.stock ?? row.cantidad ?? row.limite ?? 0),
  };
}

function isActiveOffer(offer) {
  const today = new Date();
  const expiresAt = offer.expires_at ? new Date(offer.expires_at) : null;
  const redeemedAt = offer.redeemed_at ? new Date(offer.redeemed_at) : null;
  const approved = normalizeCouponState(offer.state) === COUPON_STATES.APPROVED;
  const notExpired = !expiresAt || Number.isNaN(expiresAt.getTime()) || today <= expiresAt;

  return approved && !redeemedAt && notExpired;
}

function sanitizeFilename(filename) {
  return String(filename ?? "imagen")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function buildCouponImagePath(file, userId) {
  const safeName = sanitizeFilename(file?.name ?? "imagen");
  const extension = safeName.includes(".") ? safeName.split(".").pop() : "png";
  const uniqueId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const folder = sanitizeFilename(userId ?? "anonimo") || "anonimo";
  return `${folder}/${uniqueId}.${extension}`;
}

function getCouponImagePublicUrl(path) {
  const { data } = supabase.storage.from(COUPON_IMAGE_BUCKET).getPublicUrl(path);
  return data?.publicUrl ?? null;
}

function getCouponImagePathFromUrl(imageUrl) {
  const publicBase = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${COUPON_IMAGE_BUCKET}/`;
  if (!imageUrl || !imageUrl.startsWith(publicBase)) {
    return null;
  }

  return decodeURIComponent(imageUrl.slice(publicBase.length).split("?")[0]);
}

function serializeDateTime(value) {
  if (!normalizeText(value)) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toISOString();
}

function validateCouponPayload(values) {
  if (!normalizeText(values?.code)) {
    return "El código del cupón es obligatorio.";
  }
  if (!normalizeText(values?.title)) {
    return "El título del cupón es obligatorio.";
  }
  if (toNumber(values?.precio) <= 0) {
    return "El precio debe ser mayor que cero.";
  }
  if (!serializeDateTime(values?.expires_at)) {
    return "La fecha de expiración es obligatoria.";
  }
  if (toNumber(values?.stock) < 1) {
    return "El stock inicial debe ser de al menos 1 unidad.";
  }
  return null;
}

export function validateCouponImageFile(file) {
  if (!file) return null;

  if (!VALID_COUPON_IMAGE_TYPES.has(file.type)) {
    return "Selecciona una imagen JPG, PNG o WEBP válida.";
  }

  return null;
}

export async function uploadCouponImage({ file, userId }) {
  const fileError = validateCouponImageFile(file);
  if (fileError) {
    return {
      imageUrl: null,
      path: null,
      error: buildServiceError({ message: fileError }, fileError, 400),
    };
  }

  if (!file) {
    return { imageUrl: null, path: null, error: null };
  }

  const path = buildCouponImagePath(file, userId);
  const { error: uploadError } = await supabase.storage
    .from(COUPON_IMAGE_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    return {
      imageUrl: null,
      path: null,
      error: buildServiceError(uploadError, "No se pudo subir la imagen del cupón."),
    };
  }

  return {
    imageUrl: getCouponImagePublicUrl(path),
    path,
    error: null,
  };
}

async function removeCouponImageByUrl(imageUrl) {
  const path = getCouponImagePathFromUrl(imageUrl);
  if (!path) return;

  await supabase.storage.from(COUPON_IMAGE_BUCKET).remove([path]);
}

function toCouponPayload({ values, imageUrl }) {
  return {
    code: normalizeText(values?.code).toUpperCase(),
    title: normalizeText(values?.title),
    description: normalizeText(values?.description),
    terms: normalizeText(values?.terms),
    category: normalizeCouponCategory(values?.category),
    precio: roundCurrency(toNumber(values?.precio)),
    expires_at: serializeDateTime(values?.expires_at),
    image: imageUrl ?? null,
    stock: Math.floor(toNumber(values?.stock)),
  };
}

async function saveCouponWithImage({
  couponId = null,
  values,
  imageFile,
  currentImage,
  userId,
}) {
  try {
    const validationError = validateCouponPayload(values);
    if (validationError) {
      return {
        cupon: null,
        error: buildServiceError({ message: validationError }, validationError, 400),
      };
    }

    let imageUrl = currentImage ?? null;
    let uploadedPath = null;

    if (imageFile) {
      const uploadResult = await uploadCouponImage({ file: imageFile, userId });
      if (uploadResult.error) {
        return { cupon: null, error: uploadResult.error };
      }

      imageUrl = uploadResult.imageUrl;
      uploadedPath = uploadResult.path;
    }

    const payload = toCouponPayload({ values, imageUrl });

    const query = couponId
      ? supabase.from("cupones").update(payload).eq("id", couponId)
      : supabase.from("cupones").insert(payload);

    const { data, error } = await query.select("*").maybeSingle();

    if (error || !data) {
      if (uploadedPath) {
        await supabase.storage.from(COUPON_IMAGE_BUCKET).remove([uploadedPath]);
      }

      return {
        cupon: null,
        error: buildServiceError(
          error,
          couponId
            ? "No se pudo actualizar el cupón."
            : "No se pudo crear el cupón."
        ),
      };
    }

    if (imageFile && currentImage && currentImage !== imageUrl) {
      await removeCouponImageByUrl(currentImage);
    }

    return {
      cupon: normalizeCupon(data),
      error: null,
    };
  } catch (error) {
    return {
      cupon: null,
      error: buildServiceError(
        error,
        couponId
          ? "No se pudo actualizar el cupón."
          : "No se pudo crear el cupón."
      ),
    };
  }
}

export async function getCupones() {
  try {
    const { data, error } = await supabase
      .from("cupones")
      .select("*")
      .eq("state", COUPON_STATES.APPROVED)
      .order("created_at", { ascending: false });

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

export async function getCuponPublicoById(couponId) {
  try {
    const { data, error } = await supabase
      .from("cupones")
      .select("*")
      .eq("id", couponId)
      .eq("state", COUPON_STATES.APPROVED)
      .maybeSingle();

    if (error) {
      return { cupon: null, error };
    }

    if (!data) {
      return {
        cupon: null,
        error: buildServiceError(
          { message: "Cupón no encontrado." },
          "Cupón no encontrado.",
          404
        ),
      };
    }

    const cupon = normalizeCupon(data);
    if (!isActiveOffer(cupon)) {
      return {
        cupon: null,
        error: buildServiceError(
          { message: "La oferta ya no está disponible." },
          "La oferta ya no está disponible.",
          404
        ),
      };
    }

    return { cupon, error: null };
  } catch (error) {
    return { cupon: null, error };
  }
}

export async function getAdminCupones() {
  try {
    const { data, error } = await supabase
      .from("cupones")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return { cupones: [], error };
    }

    return {
      cupones: (data ?? []).map(normalizeCupon),
      error: null,
    };
  } catch (error) {
    return { cupones: [], error };
  }
}

export async function createCupon({ values, imageFile, userId }) {
  return saveCouponWithImage({
    values,
    imageFile,
    currentImage: null,
    userId,
  });
}

export async function updateCupon({ couponId, values, imageFile, currentImage, userId }) {
  if (!couponId) {
    return {
      cupon: null,
      error: buildServiceError(
        { message: "No se encontró el cupón a actualizar." },
        "No se encontró el cupón a actualizar.",
        404
      ),
    };
  }

  return saveCouponWithImage({
    couponId,
    values,
    imageFile,
    currentImage,
    userId,
  });
}

export async function updateCuponState(couponId, nextState) {
  const normalizedState = normalizeCouponState(nextState);

  if (!couponId) {
    return {
      cupon: null,
      error: buildServiceError(
        { message: "No se encontró el cupón a actualizar." },
        "No se encontró el cupón a actualizar.",
        404
      ),
    };
  }

  try {
    const { data, error } = await supabase
      .from("cupones")
      .update({ state: normalizedState })
      .eq("id", couponId)
      .select("*")
      .maybeSingle();

    if (error) {
      return {
        cupon: null,
        error: buildServiceError(error, "No se pudo actualizar el estado del cupón."),
      };
    }

    if (!data) {
      return {
        cupon: null,
        error: buildServiceError(
          { message: "Cupón no encontrado." },
          "Cupón no encontrado.",
          404
        ),
      };
    }

    return {
      cupon: normalizeCupon(data),
      error: null,
    };
  } catch (error) {
    return {
      cupon: null,
      error: buildServiceError(error, "No se pudo actualizar el estado del cupón."),
    };
  }
}

export function filterCuponesByTipo(cupones, tipo) {
  const target = normalizeTipoEnum(tipo);
  if (!target || target === "todas") return cupones;

  return (cupones ?? []).filter((cupon) => {
    return normalizeTipoEnum(cupon.rubro) === target;
  });
}
