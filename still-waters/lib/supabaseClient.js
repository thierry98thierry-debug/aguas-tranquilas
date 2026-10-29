"use client";
import { createClient } from "@supabase/supabase-js";

// Cliente do navegador (chave pública anon). A segurança real é feita
// pelas políticas RLS no Supabase, não aqui.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
