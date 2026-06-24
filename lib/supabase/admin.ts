import { createClient } from "@supabase/supabase-js";

// Client privilégié (clé service_role). UNIQUEMENT côté serveur.
// Contourne la sécurité RLS — à n'utiliser que pour des lectures minimales
// nécessaires aux notifications (emails des destinataires).
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
