const CHECKOUT_KEY_PREFIX = "checkout_items_v1";
const PURCHASED_KEY_PREFIX = "purchased_coupons_v1";

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
  } catch (_error) {
    return [];
  }
}

function writeList(key, value) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getCheckoutItems(userId) {
  return readList(buildStorageKey(CHECKOUT_KEY_PREFIX, userId));
}

export function addToCheckout({ userId, offer, quantity }) {
  const key = buildStorageKey(CHECKOUT_KEY_PREFIX, userId);
  const current = readList(key);
  const qty = Math.max(1, Number(quantity) || 1);

  const existingIndex = current.findIndex((item) => item.offer?.id === offer?.id);
  if (existingIndex >= 0) {
    const previous = current[existingIndex];
    current[existingIndex] = {
      ...previous,
      quantity: previous.quantity + qty,
      subtotal: (Number(previous.offer?.offer_price) || 0) * (previous.quantity + qty),
    };
  } else {
    current.push({
      id: `${offer?.id}-${Date.now()}`,
      offer,
      quantity: qty,
      subtotal: (Number(offer?.offer_price) || 0) * qty,
      addedAt: new Date().toISOString(),
    });
  }

  writeList(key, current);
  return current;
}

export function updateCheckoutQuantity({ userId, itemId, quantity }) {
  const key = buildStorageKey(CHECKOUT_KEY_PREFIX, userId);
  const current = readList(key);
  const qty = Math.max(1, Number(quantity) || 1);

  const updated = current.map((item) => {
    if (item.id !== itemId) return item;
    return {
      ...item,
      quantity: qty,
      subtotal: (Number(item.offer?.offer_price) || 0) * qty,
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

export function finalizeCheckout(userId) {
  const checkoutKey = buildStorageKey(CHECKOUT_KEY_PREFIX, userId);
  const purchasedKey = buildStorageKey(PURCHASED_KEY_PREFIX, userId);

  const checkoutItems = readList(checkoutKey);
  const purchasedItems = readList(purchasedKey);

  if (checkoutItems.length === 0) return purchasedItems;

  const finalized = checkoutItems.map((item) => ({
    ...item,
    purchaseId: `purchase-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    purchasedAt: new Date().toISOString(),
  }));

  const merged = [...finalized, ...purchasedItems];
  writeList(purchasedKey, merged);
  writeList(checkoutKey, []);

  return merged;
}

export function getPurchasedCoupons(userId) {
  return readList(buildStorageKey(PURCHASED_KEY_PREFIX, userId));
}
