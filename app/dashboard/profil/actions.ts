"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

  // Mode admin : édition du profil d'une autre Zuriste.
  const targetUserId = String(formData.get("target_user_id") || "").trim();
  if (targetUserId) {
    const { data: me } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (me?.role !== "admin") return { error: "Non autorisé." };
  }
  const db = targetUserId ? createAdminClient() : supabase;
  const ownerId = targetUserId || user.id;

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
  const bd = parseInt(String(formData.get("birth_day") || ""), 10);
  const bm = parseInt(String(formData.get("birth_month") || ""), 10);
  const birth_day = bd >= 1 && bd <= 31 ? bd : null;
  const birth_month = bm >= 1 && bm <= 12 ? bm : null;

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

  const { data: existing } = await db
    .from("providers")
    .select("id")
    .eq("user_id", ownerId)
    .maybeSingle();

  let providerId: string;
  if (existing) {
    const { error } = await db
      .from("providers")
      .update(corePayload)
      .eq("id", existing.id);
    if (error) return { error: "Échec de l'enregistrement. Réessaie." };
    providerId = existing.id as string;
  } else {
    const { data: inserted, error } = await db
      .from("providers")
      .insert({ ...corePayload, user_id: ownerId })
      .select("id")
      .single();
    if (error || !inserted) {
      return { error: "Échec de la création du profil. Réessaie." };
    }
    providerId = inserted.id as string;
  }

  const { error: contactError } = await db
    .from("provider_contacts")
    .upsert({
      provider_id: providerId,
      whatsapp_number: normalizePhone(whatsapp_raw),
      phone_number: phone_raw ? normalizePhone(phone_raw) : null,
    });
  if (contactError) {
    return { error: "Échec de l'enregistrement du contact. Réessaie." };
  }

  // Anniversaire (jour + mois) sur le profil
  await createAdminClient()
    .from("profiles")
    .update({ birth_day, birth_month })
    .eq("id", ownerId);

  revalidatePath("/dashboard/profil");
  revalidatePath("/dashboard");
  if (targetUserId) revalidatePath(`/admin/zuriste/${ownerId}`);
  return { ok: true };
}

function normalizePhone(raw: string): string {
  let d = raw.replace(/[^\d]/g, "");
  if (d.length <= 9 && !d.startsWith("241")) d = "241" + d;
  return d;
}
