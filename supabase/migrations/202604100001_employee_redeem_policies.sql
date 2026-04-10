create or replace function public.can_employee_redeem_purchase(target_coupon_id uuid)
returns boolean
language sql
stable
as $$
  select
    public.current_app_role() = 'empleado'
    and exists (
      select 1
      from public.empleados
      join public.cupones on public.cupones.id = target_coupon_id
      where public.empleados.uuid = auth.uid()
        and public.empleados.empresa = public.cupones.empresa
    );
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'compras'
      and policyname = 'compras_select_employee_redeem'
  ) then
    create policy compras_select_employee_redeem
      on public.compras
      for select
      to authenticated
      using (public.can_employee_redeem_purchase(cupon_id));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'compras'
      and policyname = 'compras_update_employee_redeem'
  ) then
    create policy compras_update_employee_redeem
      on public.compras
      for update
      to authenticated
      using (public.can_employee_redeem_purchase(cupon_id))
      with check (public.can_employee_redeem_purchase(cupon_id));
  end if;
end $$;
