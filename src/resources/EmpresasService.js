import { supabase } from "./supabaseClient";

export async function fetchEmpresas() {
  const { data, error } = await supabase
    .from('empresas')
    .select('*')
    .order('created_at', { ascending: false });
  return { data, error };
}

// Phone validator: we rely on UI regex or format ####-####
export async function createEmpresa(payload) {
  const { data, error } = await supabase
    .from('empresas')
    .insert(payload)
    .select()
    .single();
  return { data, error };
}

export async function updateEmpresa(id, payload) {
  const { data, error } = await supabase
    .from('empresas')
    .update(payload)
    .eq('id', id)
    .select()
    .single();
  return { data, error };
}

export async function deleteEmpresa(id) {
  const { data, error } = await supabase
    .from('empresas')
    .delete()
    .eq('id', id);
  return { data, error };
}

// Generate code AAA000 (3 uppercase letters + 3 digits)
const generateRandomCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const nums = "0123456789";
  let result = "";
  for(let i=0; i<3; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  for(let i=0; i<3; i++) result += nums.charAt(Math.floor(Math.random() * nums.length));
  return result;
};

// Auto generate and verify against DB recursively
export async function generateUniqueEmpresaCode() {
  while (true) {
    const code = generateRandomCode();
    // check if it exists
    const { data } = await supabase.from('empresas').select('id').eq('code', code).maybeSingle();
    // If not found, data will be null
    if (!data) return code;
  }
}
