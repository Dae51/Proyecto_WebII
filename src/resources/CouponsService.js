import { supabase } from "./supabaseClient";

export async function getUserCoupons(userId) {
  try {
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    return { coupons: data ?? [], error };
  } catch (error) {
    return { coupons: [], error };
  }
}

export async function redeemCoupon(couponId) {
  try {
    const { data, error } = await supabase
      .from("coupons")
      .update({ redeemed_at: new Date().toISOString() })
      .eq("id", couponId)
      .select();
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

export function classifyCoupon(coupon) {
  const now = new Date();
  const expiresAt = coupon.expires_at ? new Date(coupon.expires_at) : null;
  const redeemedAt = coupon.redeemed_at ? new Date(coupon.redeemed_at) : null;

  if (redeemedAt) return "redeemed";
  if (expiresAt && expiresAt < now) return "expired";
  return "available";
}
