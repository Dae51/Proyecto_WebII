import { supabase } from "./supabaseClient";

const CHECKOUT_KEY_PREFIX = "checkout_items_v1";
const PURCHASE_STATUS_PAID = "pagado";

function getUserKey(userId) {
  return userId || "guest";
}

function buildStorageKey(prefix, userId) {
  return `${prefix}:${getUserKey(userId)}`;
}

function readList(key) {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeList(key, value) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function parseValidQuantity(value) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return null;
  return parsed;
}

function normalizeQuantity(value, fallback = 1) {
  return parseValidQuantity(value) ?? fallback;
}

function calculateSubtotal(item) {
  const unitPrice = toNumber(
    item.precio_unitario ??
      item.offer?.offer_price ??
      item.unit_price
  );
  const quantity = normalizeQuantity(item.quantity, 1);
  return unitPrice * quantity;
}

function hasInvalidItems(items) {
  return (items ?? []).some((item) => parseValidQuantity(item.quantity) === null);
}

function buildServiceError(error, fallbackMessage, status = 500) {
  return {
    status,
    message: error?.message || fallbackMessage,
    details: error ?? null,
  };
}

export function getCheckoutItems(userId) {
  return readList(buildStorageKey(CHECKOUT_KEY_PREFIX, userId));
}

export function addToCheckout({ userId, offer, quantity }) {
  const key = buildStorageKey(CHECKOUT_KEY_PREFIX, userId);
  const current = readList(key);
  const qty = normalizeQuantity(quantity, 1);
  // Si el catálogo no expone precio, se conserva 0 para mantener consistencia.
  const unitPrice = toNumber(
    offer?.offer_price ??
      offer?.price ??
      offer?.precio
  );

  const existingIndex = current.findIndex((item) => item.offer?.id === offer?.id);
  if (existingIndex >= 0) {
    const previous = current[existingIndex];
    const previousQty = normalizeQuantity(previous.quantity, 1);
    const nextQty = previousQty + qty;

    current[existingIndex] = {
      ...previous,
      quantity: nextQty,
      subtotal: unitPrice * nextQty,
      cantidad: nextQty,
    };
  } else {
    current.push({
      id: `${offer?.id}-${Date.now()}`,
      offer,
      quantity: qty,
      subtotal: unitPrice * qty,
      cupon_id: offer?.id ?? null,
      nombre: offer?.title ?? "Cupon",
      precio_unitario: unitPrice,
      cantidad: qty,
      addedAt: new Date().toISOString(),
    });
  }

  writeList(key, current);
  return current;
}

export function updateCheckoutQuantity({ userId, itemId, quantity }) {
  const key = buildStorageKey(CHECKOUT_KEY_PREFIX, userId);
  const current = readList(key);
  const qty = normalizeQuantity(quantity, 1);

  const updated = current.map((item) => {
    if (item.id !== itemId) return item;
    return {
      ...item,
      quantity: qty,
      subtotal: calculateSubtotal({
        offer: item.offer,
        quantity: qty,
      }),
      cantidad: qty,
    };
  });

  writeList(key, updated);
  return updated;
}

export function removeCheckoutItem({ userId, itemId }) {
  const key = buildStorageKey(CHECKOUT_KEY_PREFIX, userId);
  const current = readList(key);
  const updated = current.filter((item) => item.id !== itemId);
  writeList(key, updated);
  return updated;
}

export function clearCheckout(userId) {
  const key = buildStorageKey(CHECKOUT_KEY_PREFIX, userId);
  writeList(key, []);
}

export function buildCheckoutPaymentRequest({ userId, items }) {
  const normalizedItems = (items ?? []).map(normalizeCartItem);
  const total = normalizedItems.reduce(
    (acc, item) => acc + (Number(item.subtotal) || 0),
    0
  );

  return {
    user_id: userId ?? null,
    items: normalizedItems,
    total,
  };
}

function normalizeCartItem(item) {
  const quantity = normalizeQuantity(item?.cantidad ?? item?.quantity, 1);
  const unitPrice = toNumber(
    item?.precio_unitario ??
      item?.offer?.offer_price ??
      item?.offer?.price ??
      item?.offer?.precio
  );

  return {
    cupon_id: item?.cupon_id ?? item?.offer?.id ?? null,
    nombre: item?.nombre ?? item?.offer?.title ?? "Cupon",
    precio_unitario: unitPrice,
    cantidad: quantity,
    subtotal: unitPrice * quantity,
    image_url: item?.offer?.image_url ?? item?.offer?.image ?? null,
    description: item?.offer?.description ?? "",
  };
}

export async function createCompra(cartItem, userId) {
  if (!userId) {
    return {
      compra: null,
      error: buildServiceError(
        { message: "Debes iniciar sesión para finalizar la compra." },
        "Debes iniciar sesión para finalizar la compra.",
        401
      ),
    };
  }

  if (!cartItem) {
    return {
      compra: null,
      error: buildServiceError(
        { message: "No hay datos de compra para registrar." },
        "No hay datos de compra para registrar.",
        400
      ),
    };
  }

  const normalized = normalizeCartItem(cartItem);
  if (!normalized.cupon_id) {
    return {
      compra: null,
      error: buildServiceError(
        { message: "No se pudo identificar el cupón seleccionado." },
        "No se pudo identificar el cupón seleccionado.",
        400
      ),
    };
  }

  if (parseValidQuantity(normalized.cantidad) === null) {
    return {
      compra: null,
      error: buildServiceError(
        { message: "La cantidad debe ser un número entero mayor o igual a 1." },
        "La cantidad debe ser un número entero mayor o igual a 1.",
        400
      ),
    };
  }

  const { data: compra, error: insertError } = await supabase
    .from("compras")
    .insert({
      user_id: userId,
      cupon_id: normalized.cupon_id,
      cantidad: normalized.cantidad,
      precio_unitario: normalized.precio_unitario,
      subtotal: normalized.subtotal,
      estado: PURCHASE_STATUS_PAID,
    })
    .select("id, user_id, cupon_id, cantidad, precio_unitario, subtotal, estado, comprado_en, created_at")
    .single();

  if (insertError || !compra) {
    return {
      compra: null,
      error: buildServiceError(
        insertError,
        "No se pudo guardar la compra en la base de datos."
      ),
    };
  }

  return { compra, error: null };
}

export async function finalizeCheckout(userId) {
  const checkoutKey = buildStorageKey(CHECKOUT_KEY_PREFIX, userId);
  const checkoutItems = readList(checkoutKey);

  if (!Array.isArray(checkoutItems) || checkoutItems.length === 0) {
    return {
      purchasedItems: [],
      error: buildServiceError(
        { message: "No hay cupones para comprar." },
        "No hay cupones para comprar.",
        400
      ),
    };
  }

  if (hasInvalidItems(checkoutItems)) {
    return {
      purchasedItems: [],
      error: buildServiceError(
        { message: "Hay cantidades inválidas en el checkout." },
        "Hay cantidades inválidas en el checkout.",
        400
      ),
    };
  }

  const createdCompras = [];
  for (const item of checkoutItems) {
    // Se inserta una fila por cupón en public.compras (estructura existente en producción).
    const { compra, error } = await createCompra(item, userId);
    if (error) {
      return { purchasedItems: createdCompras, error };
    }

    createdCompras.push(compra);
  }

  const finalized = checkoutItems.map((item, index) => {
    const normalized = normalizeCartItem(item);
    const compra = createdCompras[index];
    return {
      id: compra?.id ?? item.id,
      purchaseId: compra?.id ?? item.id,
      quantity: normalized.cantidad,
      subtotal: normalized.subtotal,
      purchasedAt: compra?.comprado_en ?? compra?.created_at ?? new Date().toISOString(),
      offer: {
        id: normalized.cupon_id,
        title: normalized.nombre,
        description: normalized.description,
        image_url: normalized.image_url,
        offer_price: normalized.precio_unitario,
      },
    };
  });

  writeList(checkoutKey, []);

  return { purchasedItems: finalized, error: null };
}

export async function listComprasByUser(userId) {
  if (!userId) {
    return {
      compras: [],
      error: buildServiceError(
        { message: "Debes iniciar sesión para ver tus cupones comprados." },
        "Debes iniciar sesión para ver tus cupones comprados.",
        401
      ),
    };
  }

  const { data: compras, error: comprasError } = await supabase
    .from("compras")
    .select("id, user_id, cupon_id, cantidad, precio_unitario, subtotal, estado, comprado_en, created_at")
    .eq("user_id", userId)
    .order("comprado_en", { ascending: false });

  if (comprasError) {
    return {
      compras: [],
      error: buildServiceError(
        comprasError,
        "No se pudo leer el historial de compras en la base de datos."
      ),
    };
  }

  const couponIds = [
    ...new Set(
      (compras ?? [])
        .map((item) => item.cupon_id)
        .filter((couponId) => couponId !== null && couponId !== undefined)
    ),
  ];

  let couponsById = new Map();
  if (couponIds.length > 0) {
    const { data: couponsData, error: couponsError } = await supabase
      .from("cupones")
      .select("id, title, description, image")
      .in("id", couponIds);

    if (couponsError) {
      return {
        compras: [],
        error: buildServiceError(
          couponsError,
          "No se pudo cargar la información de los cupones comprados."
        ),
      };
    }

    couponsById = new Map(
      (couponsData ?? []).map((coupon) => [String(coupon.id), coupon])
    );
  }

  const normalized = (compras ?? []).map((compra) => {
    const coupon = couponsById.get(String(compra.cupon_id));
    const quantity = normalizeQuantity(compra.cantidad, 1);
    const unitPrice = toNumber(compra.precio_unitario);
    const subtotal = toNumber(compra.subtotal) || unitPrice * quantity;

    return {
      id: compra.id,
      purchaseId: compra.id,
      quantity,
      subtotal,
      purchasedAt: compra.comprado_en ?? compra.created_at,
      estado: compra.estado,
      offer: {
        id: compra.cupon_id,
        title: coupon?.title ?? `Cupon #${compra.cupon_id}`,
        description: coupon?.description ?? "",
        image_url: coupon?.image ?? null,
        offer_price: unitPrice,
      },
    };
  });

  return { compras: normalized, error: null };
}

export async function getPurchasedCoupons(userId) {
  const { compras, error } = await listComprasByUser(userId);
  return { items: compras, error };
}
