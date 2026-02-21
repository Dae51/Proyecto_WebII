// Archivo de configuración del cliente de Supabase, incluyendo la creación del cliente y una función para verificar la conexión a Supabase
import { createClient } from "@supabase/supabase-js";

// Se obtienen las variables de entorno para la URL y la clave de Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// Se permite usar VITE_SUPABASE_PUBLISHABLE_KEY o VITE_SUPABASE_ANON_KEY para la clave de Supabase
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Variables de Supabase en el .env sin definir. Define VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY)."
  );
}

// Se crea el cliente de Supabase utilizando la URL y la clave obtenidas de las variables de entorno
export const supabase = createClient(supabaseUrl, supabaseKey);

// Función para verificar la conexión a Supabase, intentando obtener la sesión actual y devolviendo el resultado
export async function checkSupabaseConnection() {
  const { error } = await supabase.auth.getSession();
  return { ok: !error, error };
}
