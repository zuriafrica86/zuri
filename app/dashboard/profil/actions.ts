"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ProfileResult } from "./types";

export async function saveProfile(
  _prev: ProfileResult,
  formData: FormData
): Promise<ProfileResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Session expirée, reconnecte-toi." };

  const business_name = String(formData.get("business_name") || "").trim();
  const bio = String(formData.get("bio") || "").trim();
  const ville = String(formData.get("ville") || "").trim();
  const quartier = String(formData.get("quartier") || "").trim();
  const whatsapp_raw = String(formData.get("whatsapp_number") || "");
  const phone_raw = String(formData.get("phone_number") || "");
  const dispo = String(formData.get("dispo") || "sur_rdv");
  const profile_photo =
    String(formData.get("profile_photo") || "").trim() || null;

  if (!business_name || !ville || !quartier || !whatsapp_raw) {
    return {
      error: "Nom, ville, quartier et numéro WhatsApp sont obligatoires.",
    };
  }

  const dispoVal = ["disponible", "occupee", "sur_rdv"].includes(dispo)
    ? dispo
    : "sur_rdv";

  const payload = {
    business_name,
    bio: bio || null,
    ville,
    quartier,
    whatsapp_number: normalizePhone(whatsapp_raw),
    phone_number: phone_raw ? normalizePhone(phone_raw) : null,
    dispo: dispoVal,
    profile_photo,
  };

  // Le profil existe-t-il déjà pour cette coiffeuse ?
  const { data: existing } = await supabase
    .from("providers")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("providers")
      .update(payload)
      .eq("id", existing.id);
    if (error) return { error: "Échec de l'enregistrement. Réessaie." };
  } else {
    const { error } = await supabase
      .from("providers")
      .insert({ ...payload, user_id: user.id });
    if (error) return { error: "Échec de la création du profil. Réessaie." };
  }

  revalidatePath("/dashboard/profil");
  revalidatePath("/dashboard");
  return { ok: true };
}

// Gabon : garde seulement les chiffres ; préfixe 241 si numéro local.
function normalizePhone(raw: string): string {
  let d = raw.replace(/[^\d]/g, "");
  if (d.length <= 9 && !d.startsWith("241")) d = "241" + d;
  return d;
}
