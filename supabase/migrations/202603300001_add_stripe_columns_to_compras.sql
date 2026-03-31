alter table public.compras
  add column if not exists stripe_session_id text,
  add column if not exists stripe_payment_intent_id text;

create unique index if not exists compras_stripe_session_cupon_unique_idx
  on public.compras (stripe_session_id, cupon_id)
  where stripe_session_id is not null;

create index if not exists compras_stripe_session_idx
  on public.compras (stripe_session_id)
  where stripe_session_id is not null;

create index if not exists compras_stripe_payment_intent_idx
  on public.compras (stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;
