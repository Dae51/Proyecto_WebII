import { supabase } from "./supabaseClient";

export async function fetchClientesPaginated(page, pageSize) {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from('clientes')
    .select('*', { count: 'exact' })
    .range(from, to)
    .order('created_at', { ascending: false });

  return { data, error, count };
}
