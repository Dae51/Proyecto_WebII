do $$
begin
  if not exists (
    select 1
    from pg_type
    where typnamespace = 'public'::regnamespace
      and typname = 'state_cupon'
  ) then
    create type public.state_cupon as enum (
      'Pendiente_aprobacion',
      'Aprobado',
      'Eliminado',
      'Rechazado'
    );
  end if;
end $$;

create or replace function public.current_app_role()
returns text
language sql
stable
as $$
  select coalesce(
    nullif(auth.jwt() -> 'app_metadata' ->> 'role', ''),
    nullif(auth.jwt() -> 'user_metadata' ->> 'role', ''),
    ''
  );
$$;

create or replace function public.can_manage_coupons()
returns boolean
language sql
stable
as $$
  select public.current_app_role() in ('admin', 'empresa_admin');
$$;

create or replace function public.can_read_coupon(
  coupon_id uuid,
  coupon_state public.state_cupon
)
returns boolean
language sql
stable
as $$
  select
    public.can_manage_coupons()
    or coupon_state = 'Aprobado'::public.state_cupon
    or exists (
      select 1
      from public.compras
      where compras.cupon_id = coupon_id
        and compras.user_id = auth.uid()
    );
$$;

alter table public.cupones
  add column if not exists state text;

update public.cupones
set state = case
  when state is null or btrim(state) = '' then 'Pendiente_aprobacion'
  when lower(btrim(state)) in ('pendiente_aprobacion', 'pendiente', 'pending', 'en espera') then 'Pendiente_aprobacion'
  when lower(btrim(state)) in ('aprobado', 'approved', 'active', 'activo', 'activa', 'published', 'publicado') then 'Aprobado'
  when lower(btrim(state)) in ('rechazado', 'rejected') then 'Rechazado'
  when lower(btrim(state)) in ('eliminado', 'eliminada', 'deleted', 'discarded', 'descartado') then 'Eliminado'
  else 'Pendiente_aprobacion'
end
where state is null
   or btrim(state) = ''
   or lower(btrim(state)) not in (
     'pendiente_aprobacion',
     'pendiente',
     'pending',
     'en espera',
     'aprobado',
     'approved',
     'active',
     'activo',
     'activa',
     'published',
     'publicado',
     'rechazado',
     'rejected',
     'eliminado',
     'eliminada',
     'deleted',
     'discarded',
     'descartado'
   );

do $$
declare
  current_state_type text;
begin
  select pg_type.typname
  into current_state_type
  from pg_attribute
  join pg_class on pg_class.oid = pg_attribute.attrelid
  join pg_namespace on pg_namespace.oid = pg_class.relnamespace
  join pg_type on pg_type.oid = pg_attribute.atttypid
  where pg_namespace.nspname = 'public'
    and pg_class.relname = 'cupones'
    and pg_attribute.attname = 'state'
    and not pg_attribute.attisdropped;

  if current_state_type <> 'state_cupon' then
    alter table public.cupones
      alter column state type public.state_cupon
      using state::public.state_cupon;
  end if;
end $$;

update public.cupones
set state = 'Pendiente_aprobacion'::public.state_cupon
where state is null;

alter table public.cupones
  alter column state set default 'Pendiente_aprobacion'::public.state_cupon;

alter table public.cupones
  alter column state set not null;

create or replace function public.enforce_cupones_review_rules()
returns trigger
language plpgsql
as $$
declare
  current_role text := public.current_app_role();
  company_admin_changed_content boolean := false;
begin
  if tg_op = 'INSERT' then
    new.state := 'Pendiente_aprobacion'::public.state_cupon;
    if new.user_id is null then
      new.user_id := auth.uid();
    end if;
    return new;
  end if;

  if current_role = 'empresa_admin' then
    company_admin_changed_content :=
      new.code is distinct from old.code
      or new.title is distinct from old.title
      or new.description is distinct from old.description
      or new.terms is distinct from old.terms
      or new.expires_at is distinct from old.expires_at
      or new.image is distinct from old.image
      or new.category is distinct from old.category
      or new.precio is distinct from old.precio;

    if old.state = 'Aprobado'::public.state_cupon and company_admin_changed_content then
      new.state := 'Pendiente_aprobacion'::public.state_cupon;
    else
      new.state := old.state;
    end if;

    if new.user_id is null then
      new.user_id := coalesce(old.user_id, auth.uid());
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists cupones_review_rules on public.cupones;

create trigger cupones_review_rules
before insert or update on public.cupones
for each row
execute function public.enforce_cupones_review_rules();

drop policy if exists cupones_select_authenticated on public.cupones;
drop policy if exists cupones_select_anon on public.cupones;
drop policy if exists cupones_insert_authenticated on public.cupones;
drop policy if exists cupones_update_authenticated on public.cupones;

create policy cupones_select_authenticated
  on public.cupones
  for select
  to authenticated
  using (public.can_read_coupon(id, state));

create policy cupones_select_anon
  on public.cupones
  for select
  to anon
  using (state = 'Aprobado'::public.state_cupon);

create policy cupones_insert_authenticated
  on public.cupones
  for insert
  to authenticated
  with check (public.can_manage_coupons());

create policy cupones_update_authenticated
  on public.cupones
  for update
  to authenticated
  using (public.can_manage_coupons())
  with check (public.can_manage_coupons());

insert into storage.buckets (id, name, public)
values ('cupones', 'cupones', true)
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public;

drop policy if exists storage_cupones_select_public on storage.objects;
drop policy if exists storage_cupones_insert_authenticated on storage.objects;
drop policy if exists storage_cupones_update_authenticated on storage.objects;
drop policy if exists storage_cupones_delete_authenticated on storage.objects;

create policy storage_cupones_select_public
  on storage.objects
  for select
  to public
  using (bucket_id = 'cupones');

create policy storage_cupones_insert_authenticated
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'cupones'
    and public.can_manage_coupons()
  );

create policy storage_cupones_update_authenticated
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'cupones'
    and public.can_manage_coupons()
  )
  with check (
    bucket_id = 'cupones'
    and public.can_manage_coupons()
  );

create policy storage_cupones_delete_authenticated
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'cupones'
    and public.can_manage_coupons()
  );
