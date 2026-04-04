import { supabase } from "./resources/supabaseClient.js";

async function check() {
  const { data, error } = await supabase.from('cupones').select('*').limit(1);
  if (error) console.error(error);
  else {
    console.log("Keys available in cupones table:");
    if (data.length > 0) {
      console.log(Object.keys(data[0]));
    } else {
      console.log("Table is empty, no keys to show.");
    }
  }
}

check();
