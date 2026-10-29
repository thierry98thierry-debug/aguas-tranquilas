import { createClient } from "@supabase/supabase-js";

// Cliente de SERVIDOR com a service_role key. Use SOMENTE em rotas de API
// (ex.: o webhook da Greenn). Nunca importe isto em componentes do navegador.
export function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
