import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@14";
import { corsHeaders } from "../_shared/cors.ts";
import { buildValidatedCheckoutItems } from "../_shared/purchases.ts";

const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2024-11-20",
      httpClient: Stripe.createFetchHttpClient(),
    })
  : null;

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function getBaseUrl(request: Request, payloadOrigin: unknown) {
  const rawOrigin =
    request.headers.get("origin") ??
    (typeof payloadOrigin === "string" ? payloadOrigin : null) ??
    Deno.env.get("SITE_URL") ??
    Deno.env.get("PUBLIC_SITE_URL") ??
    "";

  try {
    const url = new URL(rawOrigin);
    return url.origin;
  } catch {
    return "";
  }
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Método no permitido." }, 405);
  }

  if (!stripe || !supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    return jsonResponse(
      { error: "Faltan variables de entorno para inicializar el pago." },
      500
    );
  }

  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    return jsonResponse({ error: "No autorizado." }, 401);
  }

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: "El cuerpo de la solicitud no es válido." }, 400);
  }

  const baseUrl = getBaseUrl(request, payload.origin);
  if (!baseUrl) {
    return jsonResponse(
      { error: "No se pudo determinar la URL base para el retorno del pago." },
      400
    );
  }

  const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
  });

  const {
    data: { user },
    error: userError,
  } = await supabaseUser.auth.getUser();

  if (userError || !user) {
    return jsonResponse({ error: "La sesión del usuario no es válida." }, 401);
  }

  if (payload.user_id && payload.user_id !== user.id) {
    return jsonResponse(
      { error: "La sesión no coincide con el usuario que intenta pagar." },
      403
    );
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

  let checkoutItems;
  let total;

  try {
    const result = await buildValidatedCheckoutItems(supabaseAdmin, payload.items);
    checkoutItems = result.items;
    total = result.total;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No se pudo validar el checkout antes de crear el pago.";
    return jsonResponse({ error: message }, 400);
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      locale: "es",
      client_reference_id: user.id,
      customer_email: user.email ?? undefined,
      success_url: `${baseUrl}/cupones-comprados?pago=exito&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout?pago=cancelado`,
      metadata: {
        user_id: user.id,
        total: total.toFixed(2),
      },
      line_items: checkoutItems.map((item) => ({
        quantity: item.cantidad,
        metadata: {
          cupon_id: String(item.cupon_id),
          precio_unitario: item.precio_unitario.toFixed(2),
        },
        price_data: {
          currency: "usd",
          unit_amount: Math.round(item.precio_unitario * 100),
          product_data: {
            name: item.nombre,
            description: item.description || undefined,
            metadata: {
              cupon_id: String(item.cupon_id),
            },
          },
        },
      })),
    });

    if (!session.url) {
      return jsonResponse(
        { error: "Stripe no devolvió una URL de checkout válida." },
        500
      );
    }

    return jsonResponse({
      url: session.url,
      sessionId: session.id,
      total,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No se pudo crear la sesión de Stripe Checkout.";
    return jsonResponse({ error: message }, 500);
  }
});
