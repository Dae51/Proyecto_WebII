import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@14";
import { buildCompraRowsFromStripeLineItems } from "../_shared/purchases.ts";

const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2024-11-20",
      httpClient: Stripe.createFetchHttpClient(),
    })
  : null;

const cryptoProvider = Stripe.createSubtleCryptoProvider();

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Método no permitido." }, 405);
  }

  if (!stripe || !stripeWebhookSecret || !supabaseUrl || !supabaseServiceRoleKey) {
    return jsonResponse(
      { error: "Faltan variables de entorno para procesar el webhook." },
      500
    );
  }

  const signature = request.headers.get("Stripe-Signature");
  if (!signature) {
    return jsonResponse({ error: "Firma de Stripe no encontrada." }, 400);
  }

  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      stripeWebhookSecret,
      undefined,
      cryptoProvider
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Firma de webhook inválida.";
    return jsonResponse({ error: message }, 400);
  }

  if (event.type !== "checkout.session.completed") {
    return jsonResponse({ received: true, ignored: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  if (session.mode !== "payment" || session.payment_status !== "paid") {
    return jsonResponse({ received: true, ignored: true });
  }

  const userId = session.metadata?.user_id ?? session.client_reference_id;
  if (!userId) {
    return jsonResponse(
      { error: "La sesión de Stripe no incluye un usuario válido." },
      400
    );
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

  const { data: existingRows, error: existingRowsError } = await supabaseAdmin
    .from("compras")
    .select("id")
    .eq("stripe_session_id", session.id)
    .limit(1);

  if (existingRowsError) {
    return jsonResponse(
      { error: "No se pudo validar si la compra ya fue registrada." },
      500
    );
  }

  if ((existingRows ?? []).length > 0) {
    return jsonResponse({ received: true, duplicate: true });
  }

  let lineItems: Stripe.ApiList<Stripe.LineItem>;
  try {
    lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
      limit: 100,
      expand: ["data.price.product"],
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No se pudieron recuperar los line items de Stripe.";
    return jsonResponse({ error: message }, 500);
  }

  if (!lineItems.data.length) {
    return jsonResponse(
      { error: "La sesión completada no contiene productos para registrar." },
      400
    );
  }

  let compraRows;
  try {
    compraRows = buildCompraRowsFromStripeLineItems({
      userId,
      stripeSessionId: session.id,
      stripePaymentIntentId:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id ?? null,
      lineItems: lineItems.data as unknown as Array<Record<string, unknown>>,
      purchasedAt: new Date().toISOString(),
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No se pudieron construir las compras desde la sesión de Stripe.";
    return jsonResponse({ error: message }, 400);
  }

  const { error: upsertError } = await supabaseAdmin
    .from("compras")
    .upsert(compraRows, {
      onConflict: "stripe_session_id,cupon_id",
      ignoreDuplicates: true,
    });

  if (upsertError) {
    return jsonResponse(
      { error: upsertError.message || "No se pudieron guardar las compras." },
      500
    );
  }

  return jsonResponse({ received: true, processed: true });
});
