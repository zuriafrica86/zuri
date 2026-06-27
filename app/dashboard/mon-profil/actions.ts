"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ProfileResult } from "./types";

export async function saveClienteProfile(
  _prev: ProfileResult,
  formData: FormData
): Promise<ProfileResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu n'es pas connectée." };

  const prenom = String(formData.get("prenom") || "").trim();
  const nom = String(formData.get("nom") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  if (!prenom) return { error: "Le prénom est requis." };

  const full_name = `${prenom} ${nom}`.trim();

  // profil (service-role pour fiabilité), puis métadonnées du compte
  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ full_name, phone: phone || null })
    .eq("id", user.id);
  if (error) return { error: "Impossible d'enregistrer pour le moment." };

  await supabase.auth.updateUser({
    data: { prenom, nom, full_name, phone },
  });

  revalidatePath("/dashboard/mon-profil");
  revalidatePath("/dashboard");
  return { ok: true };
}
