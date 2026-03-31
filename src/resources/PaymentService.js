import { getCurrentSession } from "./AuthService";
import { buildCheckoutPaymentRequest } from "./PurchaseService";
import { supabase } from "./supabaseClient";

function buildPaymentError(message) {
  return { message };
}

export async function createStripeCheckoutSession({ userId, items }) {
  const { session, error: sessionError } = await getCurrentSession();

  if (sessionError) {
    return {
      checkoutUrl: null,
      sessionId: null,
      error: buildPaymentError(
        sessionError.message || "No se pudo validar la sesión actual."
      ),
    };
  }

  const accessToken = session?.access_token;
  if (!accessToken) {
    return {
      checkoutUrl: null,
      sessionId: null,
      error: buildPaymentError("Debes iniciar sesión para continuar con el pago."),
    };
  }

  const payload = buildCheckoutPaymentRequest({ userId, items });
  const { data, error } = await supabase.functions.invoke(
    "create-stripe-checkout-session",
    {
      body: {
        ...payload,
        origin: window.location.origin,
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (error) {
    return {
      checkoutUrl: null,
      sessionId: null,
      error: buildPaymentError(
        error.message || "No se pudo iniciar el proceso de pago."
      ),
    };
  }

  if (!data?.url) {
    return {
      checkoutUrl: null,
      sessionId: null,
      error: buildPaymentError("No se recibió una URL válida de Stripe Checkout."),
    };
  }

  return {
    checkoutUrl: data.url,
    sessionId: data.sessionId ?? null,
    error: null,
  };
}
