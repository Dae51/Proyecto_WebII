import { supabase } from "./supabaseClient";

export async function fetchCategorias() {
  const { data, error } = await supabase
    .from('categorias')
    .select('*')
    .order('created_at', { ascending: false });
  return { data, error };
}

export async function createCategoria(categories) {
  const { data, error } = await supabase
    .from('categorias')
    .insert({ categories })
    .select()
    .single();
  return { data, error };
}

export async function updateCategoria(id, categories) {
  const { data, error } = await supabase
    .from('categorias')
    .update({ categories })
    .eq('id', id)
    .select()
    .single();
  return { data, error };
}

export async function deleteCategoria(id) {
  const { data, error } = await supabase
    .from('categorias')
    .delete()
    .eq('id', id);
  return { data, error };
}
