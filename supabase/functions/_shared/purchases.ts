import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

const PURCHASE_STATUS_PAID = "pagado";

function toRecord(value: unknown) {
  if (typeof value === "object" && value !== null) {
    return value as Record<string, unknown>;
  }

  return {};
}

function toNumber(value: unknown) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function roundCurrency(value: number) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function parseValidQuantity(value: unknown) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return null;
  return parsed;
}

function normalizeTipoEnum(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/restaurantes/g, "restaurante");
}

function buildFallbackOfferPrice(couponId: unknown) {
  const text = String(couponId ?? "");
  let hash = 0;

  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) % 100000;
  }

  return 15 + (hash % 36);
}

function normalizePrices({
  couponId,
  regular,
  offer,
}: {
  couponId: unknown;
  regular: unknown;
  offer: unknown;
}) {
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

function normalizeCupon(row: Record<string, unknown>) {
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

  const { offer_price } = normalizePrices({
    couponId: row.id,
    regular: rawRegular,
    offer: rawOffer,
  });

  return {
    id: row.id,
    title: row.title ?? row.titulo ?? row.nombre ?? "Oferta sin titulo",
    description: row.description ?? row.descripcion ?? "",
    offer_price,
    rubro:
      normalizeTipoEnum(
        row.tipo ??
          row.rubro ??
          row.categoria ??
          row.tipo_cupon ??
          row.tipo_oferta ??
          row.category
      ) || "otros",
    image_url:
      row.image_url ??
      row.imagen_url ??
      row.imagen ??
      row.image ??
      row.foto_url ??
      row.foto ??
      row.url_imagen ??
      null,
  };
}

function extractCouponId(value: unknown) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text ? text : null;
}

function normalizeInputItems(rawItems: unknown) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw new Error("No hay cupones válidos para procesar el pago.");
  }

  const quantitiesByCouponId = new Map<string, number>();

  for (const rawItem of rawItems) {
    const itemRecord = toRecord(rawItem);
    const offerRecord = toRecord(itemRecord.offer);
    const couponId = extractCouponId(
      itemRecord.cupon_id ?? offerRecord.id
    );
    const quantity = parseValidQuantity(
      itemRecord.cantidad ?? itemRecord.quantity
    );

    if (!couponId) {
      throw new Error("Uno de los cupones del checkout no es válido.");
    }

    if (!quantity) {
      throw new Error("Hay cantidades inválidas en el checkout.");
    }

    quantitiesByCouponId.set(
      couponId,
      (quantitiesByCouponId.get(couponId) ?? 0) + quantity
    );
  }

  return quantitiesByCouponId;
}

export async function buildValidatedCheckoutItems(
  supabaseAdmin: SupabaseClient,
  rawItems: unknown
) {
  const quantitiesByCouponId = normalizeInputItems(rawItems);
  const couponIds = [...quantitiesByCouponId.keys()];

  const { data, error } = await supabaseAdmin
    .from("cupones")
    .select("*")
    .in("id", couponIds);

  if (error) {
    throw new Error("No se pudo validar la información de los cupones.");
  }

  const couponsById = new Map(
    (data ?? []).map((row) => {
      const normalized = normalizeCupon(row);
      return [String(normalized.id), normalized];
    })
  );

  const items = couponIds.map((couponId) => {
    const coupon = couponsById.get(String(couponId));
    if (!coupon) {
      throw new Error("Uno de los cupones ya no está disponible.");
    }

    const quantity = quantitiesByCouponId.get(couponId) ?? 0;
    const unitPrice = toNumber(coupon.offer_price);
    if (unitPrice <= 0) {
      throw new Error(
        `El cupón "${coupon.title}" no tiene un precio válido para procesar el pago.`
      );
    }

    return {
      cupon_id: coupon.id,
      nombre: String(coupon.title),
      description: String(coupon.description ?? ""),
      precio_unitario: roundCurrency(unitPrice),
      cantidad: quantity,
      subtotal: roundCurrency(unitPrice * quantity),
    };
  });

  return {
    items,
    total: roundCurrency(
      items.reduce((acc, item) => acc + toNumber(item.subtotal), 0)
    ),
  };
}

export function buildCompraRowsFromStripeLineItems({
  userId,
  stripeSessionId,
  stripePaymentIntentId,
  lineItems,
  purchasedAt,
}: {
  userId: string;
  stripeSessionId: string;
  stripePaymentIntentId: string | null;
  lineItems: Array<Record<string, unknown>>;
  purchasedAt: string;
}) {
  const rowsByCouponId = new Map<
    string,
    {
      user_id: string;
      cupon_id: string;
      cantidad: number;
      precio_unitario: number;
      subtotal: number;
      estado: string;
      comprado_en: string;
      stripe_session_id: string;
      stripe_payment_intent_id: string | null;
    }
  >();

  for (const rawItem of lineItems) {
    const quantity = parseValidQuantity(rawItem.quantity);
    const lineMetadata = toRecord(rawItem.metadata);
    const price = toRecord(rawItem.price);
    const product = toRecord(price.product);
    const productMetadata = toRecord(product.metadata);

    const couponId = extractCouponId(
      lineMetadata.cupon_id ?? productMetadata.cupon_id
    );

    if (!couponId || !quantity) {
      throw new Error(
        "La sesión de Stripe no contiene información suficiente para registrar la compra."
      );
    }

    const unitAmountCents = toNumber(price.unit_amount);
    const amountTotalCents = toNumber(rawItem.amount_total);
    const unitPrice = roundCurrency(
      (unitAmountCents || amountTotalCents / quantity) / 100
    );
    const subtotal = roundCurrency(amountTotalCents / 100);

    rowsByCouponId.set(couponId, {
      user_id: userId,
      cupon_id: couponId,
      cantidad: quantity,
      precio_unitario: unitPrice,
      subtotal,
      estado: PURCHASE_STATUS_PAID,
      comprado_en: purchasedAt,
      stripe_session_id: stripeSessionId,
      stripe_payment_intent_id: stripePaymentIntentId,
    });
  }

  return [...rowsByCouponId.values()];
}
