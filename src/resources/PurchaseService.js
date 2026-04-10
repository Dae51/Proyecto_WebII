import { normalizeRole, USER_ROLES } from "./roles";
import { supabase } from "./supabaseClient";
import { normalizeText } from "./validator";

const CHECKOUT_KEY_PREFIX = "checkout_items_v1";
export const PURCHASE_STATES = {
  AVAILABLE: "DISPONIBLE",
  REDEEMED: "CANJEADO",
};

const LEGACY_AVAILABLE_STATES = new Set([
  "DISPONIBLE",
  "PAGADO",
  "AVAILABLE",
  "PAID",
]);

const LEGACY_REDEEMED_STATES = new Set([
  "CANJEADO",
  "REDEEMED",
]);

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

function normalizeStatusToken(value) {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function normalizePurchaseStatus(value) {
  const normalized = normalizeStatusToken(value);

  if (LEGACY_AVAILABLE_STATES.has(normalized)) {
    return PURCHASE_STATES.AVAILABLE;
  }

  if (LEGACY_REDEEMED_STATES.has(normalized)) {
    return PURCHASE_STATES.REDEEMED;
  }

  return normalized || "";
}

export function isPurchaseAvailable(value) {
  return normalizePurchaseStatus(value) === PURCHASE_STATES.AVAILABLE;
}

export function isPurchaseRedeemed(value) {
  return normalizePurchaseStatus(value) === PURCHASE_STATES.REDEEMED;
}

export function normalizeCouponCode(value) {
  return normalizeText(value).toUpperCase();
}

export function normalizeDui(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (digits.length === 9) {
    return `${digits.slice(0, 8)}-${digits.slice(8)}`;
  }

  return normalizeText(value);
}

function formatCustomerName(cliente) {
  return [cliente?.name, cliente?.last_name].filter(Boolean).join(" ").trim() || "Cliente sin nombre";
}

function getCanonicalStatusFilterValues(statusFilter) {
  const normalized = normalizePurchaseStatus(statusFilter);

  if (normalized === PURCHASE_STATES.AVAILABLE) {
    return ["DISPONIBLE", "disponible", "PAGADO", "pagado"];
  }

  if (normalized === PURCHASE_STATES.REDEEMED) {
    return ["CANJEADO", "canjeado"];
  }

  return normalized ? [statusFilter] : [];
}

function getCouponExpirationDate(cupon) {
  const rawValue = cupon?.expires_at ?? cupon?.end_date ?? cupon?.fecha_fin ?? null;
  if (!rawValue) return null;

  const parsed = new Date(rawValue);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isCouponExpired(cupon) {
  const expirationDate = getCouponExpirationDate(cupon);
  if (!expirationDate) return false;
  return expirationDate.getTime() < Date.now();
}

async function getAuthenticatedEmployeeContext() {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    return {
      context: null,
      error: buildServiceError(authError, "No se pudo validar la sesión del empleado.", 401),
    };
  }

  if (!user) {
    return {
      context: null,
      error: buildServiceError(
        { message: "Debes iniciar sesión para validar y canjear cupones." },
        "Debes iniciar sesión para validar y canjear cupones.",
        401
      ),
    };
  }

  const role = normalizeRole(user?.app_metadata?.role || user?.user_metadata?.role);
  if (role !== USER_ROLES.EMPLOYEE) {
    return {
      context: null,
      error: buildServiceError(
        { message: "Solo los usuarios con rol EMPLEADO pueden canjear cupones." },
        "Solo los usuarios con rol EMPLEADO pueden canjear cupones.",
        403
      ),
    };
  }

  const { data: empleado, error: employeeError } = await supabase
    .from("empleados")
    .select("uuid, empresa")
    .eq("uuid", user.id)
    .maybeSingle();

  if (employeeError) {
    return {
      context: null,
      error: buildServiceError(
        employeeError,
        "No se pudo verificar la vinculación del empleado."
      ),
    };
  }

  if (!empleado?.empresa) {
    return {
      context: null,
      error: buildServiceError(
        { message: "Tu usuario empleado no está asociado a una empresa." },
        "Tu usuario empleado no está asociado a una empresa.",
        403
      ),
    };
  }

  return {
    context: {
      user,
      empleado,
      empresaId: empleado.empresa,
    },
    error: null,
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
      estado: PURCHASE_STATES.AVAILABLE,
    })
    .select("id, user_id, cupon_id, cantidad, precio_unitario, subtotal, estado, comprado_en, canjeado_en, created_at, updated_at")
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
    const normalized = normalizeCartItem(item);

    for (let index = 0; index < normalized.cantidad; index += 1) {
      const { compra, error } = await createCompra(
        {
          ...item,
          cantidad: 1,
          quantity: 1,
        },
        userId
      );

      if (error) {
        return { purchasedItems: createdCompras, error };
      }

      createdCompras.push({
        compra,
        item: normalized,
      });
    }
  }

  const finalized = createdCompras.map(({ compra, item }) => {
    return {
      id: compra?.id ?? item.cupon_id,
      purchaseId: compra?.id ?? item.cupon_id,
      quantity: 1,
      subtotal: compra?.subtotal ?? item.precio_unitario,
      purchasedAt: compra?.comprado_en ?? compra?.created_at ?? new Date().toISOString(),
      estado: normalizePurchaseStatus(compra?.estado),
      offer: {
        id: item.cupon_id,
        title: item.nombre,
        description: item.description,
        image_url: item.image_url,
        offer_price: item.precio_unitario,
      },
    };
  });

  writeList(checkoutKey, []);

  return { purchasedItems: finalized, error: null };
}

export async function listComprasByUser(userId, statusFilter = null) {
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

  let query = supabase
    .from("compras")
    .select("id, user_id, cupon_id, cantidad, precio_unitario, subtotal, estado, comprado_en, canjeado_en, created_at, updated_at")
    .eq("user_id", userId)
    .order("comprado_en", { ascending: false });

  if (statusFilter) {
    const filterValues = getCanonicalStatusFilterValues(statusFilter);
    if (filterValues.length > 1) {
      query = query.in("estado", filterValues);
    } else if (filterValues.length === 1) {
      query = query.eq("estado", filterValues[0]);
    }
  }

  const { data: compras, error: comprasError } = await query;

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
      .select("*")
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
      canjeadoEn: compra.canjeado_en ?? null,
      estado: normalizePurchaseStatus(compra.estado),
      estadoOriginal: compra.estado,
      offer: {
        id: compra.cupon_id,
        title: coupon?.title ?? coupon?.titulo ?? coupon?.nombre ?? `Cupon #${compra.cupon_id}`,
        description: coupon?.description ?? coupon?.descripcion ?? "",
        code: coupon?.code ?? null,
        image_url: coupon?.image_url ?? coupon?.imagen_url ?? coupon?.imagen ?? coupon?.image ?? null,
        offer_price: unitPrice,
        expiration_date: coupon?.end_date ?? coupon?.fecha_fin ?? coupon?.expires_at ?? null,
      },
    };
  });

  return { compras: normalized, error: null };
}

export async function getPurchasedCoupons(userId, statusFilter = null) {
  const { compras, error } = await listComprasByUser(userId, statusFilter);
  return { items: compras, error };
}

export async function validateAndRedeemCoupon({ code, dui }) {
  const normalizedCode = normalizeCouponCode(code);
  const normalizedDui = normalizeDui(dui);

  if (!normalizedCode) {
    return {
      data: null,
      error: buildServiceError(
        { message: "Debes ingresar el código del cupón." },
        "Debes ingresar el código del cupón.",
        400
      ),
    };
  }

  if (!/^\d{8}-\d$/.test(normalizedDui)) {
    return {
      data: null,
      error: buildServiceError(
        { message: "El DUI debe tener formato ########-#." },
        "El DUI debe tener formato ########-#.",
        400
      ),
    };
  }

  const { context, error: employeeContextError } = await getAuthenticatedEmployeeContext();
  if (employeeContextError) {
    return { data: null, error: employeeContextError };
  }

  const { data: cliente, error: clientError } = await supabase
    .from("clientes")
    .select("uuid, name, last_name, DUI")
    .eq("DUI", normalizedDui)
    .maybeSingle();

  if (clientError) {
    return {
      data: null,
      error: buildServiceError(clientError, "No se pudo validar el cliente."),
    };
  }

  if (!cliente?.uuid) {
    return {
      data: null,
      error: buildServiceError(
        { message: "Cliente no encontrado con ese DUI." },
        "Cliente no encontrado con ese DUI.",
        404
      ),
    };
  }

  const { data: cupon, error: couponError } = await supabase
    .from("cupones")
    .select("id, code, title, description, expires_at, empresa")
    .eq("code", normalizedCode)
    .maybeSingle();

  if (couponError) {
    return {
      data: null,
      error: buildServiceError(couponError, "No se pudo validar el cupón."),
    };
  }

  if (!cupon?.id) {
    return {
      data: null,
      error: buildServiceError(
        { message: "Cupón no encontrado con ese código." },
        "Cupón no encontrado con ese código.",
        404
      ),
    };
  }

  if (cupon.empresa && context.empresaId && cupon.empresa !== context.empresaId) {
    return {
      data: null,
      error: buildServiceError(
        { message: "No puedes canjear cupones de otra empresa." },
        "No puedes canjear cupones de otra empresa.",
        403
      ),
    };
  }

  const { data: compras, error: purchasesError } = await supabase
    .from("compras")
    .select("id, user_id, cupon_id, cantidad, precio_unitario, subtotal, estado, comprado_en, canjeado_en, created_at")
    .eq("user_id", cliente.uuid)
    .eq("cupon_id", cupon.id)
    .order("comprado_en", { ascending: true })
    .order("created_at", { ascending: true });

  if (purchasesError) {
    return {
      data: null,
      error: buildServiceError(
        purchasesError,
        "No se pudieron validar las compras del cliente para este cupón."
      ),
    };
  }

  const availableCompra = (compras ?? []).find((compra) => isPurchaseAvailable(compra.estado));
  const redeemedCompra = (compras ?? []).find((compra) => isPurchaseRedeemed(compra.estado));

  if (!availableCompra) {
    if (redeemedCompra) {
      return {
        data: null,
        error: buildServiceError(
          { message: "Este cliente ya canjeó este cupón y no tiene unidades disponibles." },
          "Este cliente ya canjeó este cupón y no tiene unidades disponibles.",
          409
        ),
      };
    }

    return {
      data: null,
      error: buildServiceError(
        { message: "No hay compras disponibles de este cupón para el cliente." },
        "No hay compras disponibles de este cupón para el cliente.",
        404
      ),
    };
  }

  if (isCouponExpired(cupon)) {
    return {
      data: null,
      error: buildServiceError(
        { message: "El cupón está vencido y no puede ser canjeado." },
        "El cupón está vencido y no puede ser canjeado.",
        409
      ),
    };
  }

  const redeemedAt = new Date().toISOString();
  const { data: updatedCompra, error: updateError } = await supabase
    .from("compras")
    .update({
      estado: PURCHASE_STATES.REDEEMED,
      canjeado_en: redeemedAt,
      updated_at: redeemedAt,
    })
    .eq("id", availableCompra.id)
    .eq("estado", availableCompra.estado)
    .select("id, user_id, cupon_id, cantidad, precio_unitario, subtotal, estado, comprado_en, canjeado_en, created_at, updated_at")
    .maybeSingle();

  if (updateError) {
    return {
      data: null,
      error: buildServiceError(updateError, "No se pudo completar el canje del cupón."),
    };
  }

  if (!updatedCompra?.id) {
    return {
      data: null,
      error: buildServiceError(
        { message: "El cupón ya no estaba disponible al momento de confirmar el canje." },
        "El cupón ya no estaba disponible al momento de confirmar el canje.",
        409
      ),
    };
  }

  return {
    data: {
      compraId: updatedCompra.id,
      estado: normalizePurchaseStatus(updatedCompra.estado),
      canjeadoEn: updatedCompra.canjeado_en ?? redeemedAt,
      compradoEn: updatedCompra.comprado_en ?? updatedCompra.created_at ?? null,
      subtotal: updatedCompra.subtotal,
      precioUnitario: updatedCompra.precio_unitario,
      cliente: {
        id: cliente.uuid,
        nombreCompleto: formatCustomerName(cliente),
        dui: cliente.DUI ?? normalizedDui,
      },
      cupon: {
        id: cupon.id,
        code: cupon.code ?? normalizedCode,
        title: cupon.title ?? "Cupón",
        description: cupon.description ?? "",
        expiresAt: cupon.expires_at ?? null,
      },
    },
    error: null,
  };
}
