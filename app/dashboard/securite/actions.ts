"use server";

import { createClient } from "@/lib/supabase/server";
import { notifyPasswordChanged } from "@/lib/notify";

// Appelée par le formulaire après un changement de mot de passe réussi.
// Envoie un email de sécurité à l'utilisateur connecté.
export async function notifyPasswordChange() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.email) {
    await notifyPasswordChanged(user.email);
  }
}
