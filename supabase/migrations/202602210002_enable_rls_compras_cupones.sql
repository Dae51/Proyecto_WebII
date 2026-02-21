alter table public.compras enable row level security;
alter table public.cupones enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'compras'
      and policyname = 'compras_select_own'
  ) then
    create policy compras_select_own
      on public.compras
      for select
      to authenticated
      using (user_id = auth.uid());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'compras'
      and policyname = 'compras_insert_own'
  ) then
    create policy compras_insert_own
      on public.compras
      for insert
      to authenticated
      with check (user_id = auth.uid());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'compras'
      and policyname = 'compras_update_own'
  ) then
    create policy compras_update_own
      on public.compras
      for update
      to authenticated
      using (user_id = auth.uid())
      with check (user_id = auth.uid());
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'cupones'
      and policyname = 'cupones_select_authenticated'
  ) then
    create policy cupones_select_authenticated
      on public.cupones
      for select
      to authenticated
      using (true);
  end if;
end $$;

-- La app carga catálogo sin login en Home, por eso se incluye lectura para anon.
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'cupones'
      and policyname = 'cupones_select_anon'
  ) then
    create policy cupones_select_anon
      on public.cupones
      for select
      to anon
      using (true);
  end if;
end $$;
