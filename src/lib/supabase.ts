import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anonKey) {
  throw new Error("Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env");
}

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // implicit: o link de convite/recuperação funciona em qualquer navegador,
    // não só no que pediu o e-mail (o admin convida pelo navegador dele).
    flowType: "implicit",
  },
});

export const MIDIA_BUCKET = "midia";
