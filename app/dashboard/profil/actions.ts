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
  const nom = String(formData.get("nom") || "").trim();
  const prenom = String(formData.get("prenom") || "").trim();
  const bio = String(formData.get("bio") || "").trim();
  const ville = String(formData.get("ville") || "").trim();
  const quartier = String(formData.get("quartier") || "").trim();
  const whatsapp_raw = String(formData.get("whatsapp_number") || "");
  const phone_raw = String(formData.get("phone_number") || "");
  const lieu = String(formData.get("lieu") || "chez_zuriste");
  const dispo = String(formData.get("dispo") || "disponible");
  const profile_photo =
    String(formData.get("profile_photo") || "").trim() || null;

  if (!business_name || !nom || !prenom || !ville || !whatsapp_raw) {
    return {
      error: "Nom public, nom, prénom, ville et WhatsApp sont obligatoires.",
    };
  }
  if (!bio) return { error: "La présentation est obligatoire." };
  if (!profile_photo) return { error: "Ajoute une photo de profil." };

  const lieuVal = ["chez_zuriste", "chez_cliente", "les_deux"].includes(lieu)
    ? lieu
    : "chez_zuriste";
  const dispoVal = ["disponible", "indisponible", "masque"].includes(dispo)
    ? dispo
    : "disponible";

  const corePayload = {
    business_name,
    nom,
    prenom,
    bio,
    ville,
    quartier: quartier || null,
    lieu: lieuVal,
    dispo: dispoVal,
    profile_photo,
  };

  const { data: existing } = await supabase
    .from("providers")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  let providerId: string;
  if (existing) {
    const { error } = await supabase
      .from("providers")
      .update(corePayload)
      .eq("id", existing.id);
    if (error) return { error: "Échec de l'enregistrement. Réessaie." };
    providerId = existing.id as string;
  } else {
    const { data: inserted, error } = await supabase
      .from("providers")
      .insert({ ...corePayload, user_id: user.id })
      .select("id")
      .single();
    if (error || !inserted) {
      return { error: "Échec de la création du profil. Réessaie." };
    }
    providerId = inserted.id as string;
  }

  const { error: contactError } = await supabase
    .from("provider_contacts")
    .upsert({
      provider_id: providerId,
      whatsapp_number: normalizePhone(whatsapp_raw),
      phone_number: phone_raw ? normalizePhone(phone_raw) : null,
    });
  if (contactError) {
    return { error: "Échec de l'enregistrement du contact. Réessaie." };
  }

  revalidatePath("/dashboard/profil");
  revalidatePath("/dashboard");
  return { ok: true };
}

function normalizePhone(raw: string): string {
  let d = raw.replace(/[^\d]/g, "");
  if (d.length <= 9 && !d.startsWith("241")) d = "241" + d;
  return d;
}
